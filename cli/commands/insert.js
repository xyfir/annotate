const {
  findMarkers,
  buildString,
  INSERT_MODES
} = require('@xyfir/annotate-html');
const TEMPLATES = require('lib/insert/file/templates');
const getConfig = require('lib/config/get');
const writeFile = require('lib/files/write');
const constants = require('../constants');
const readFile = require('lib/files/read');
const unzipper = require('unzipper');
const archiver = require('archiver');
const Calibre = require('node-calibre');
const request = require('superagent');
const util = require('util');
const glob = util.promisify(require('glob'));
const path = require('path');
const fs = require('fs-extra');

/**
 * @typedef {object} InsertFileArguments
 * @prop {boolean} [deleteSource]
 * @prop {boolean} [footnotes]
 * @prop {boolean} [convert]
 * @prop {string} [mode] - `"wrap" | "reference"`
 * @prop {string} file
 * @prop {number} set
 */
/**
 * Insert annotations into an ebook file using links wrapped around search
 *  matches that point to the xyAnnotations item viewer.
 * @param {object} yargs
 * @param {InsertFileArguments} yargs.argv
 */
module.exports = async function(yargs) {
  const { deleteSource, convert, mode = 'REFERENCE', set: setId } = yargs.argv;
  let { file, footnotes } = yargs.argv;
  file = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

  try {
    const isEPUB = /\.epub$/.test(file);

    if (!setId) throw 'Missing `--set <id>`';
    if (!file) throw 'Missing `--file <path>`';
    if (!isEPUB && !convert)
      throw 'Only `.epub` files are supported without the `--convert` option';

    // Convert non-epub file to epub
    let ogFile = '';
    if (!isEPUB) {
      const calibre = new Calibre({});

      ogFile = file;
      file += '.epub';

      await calibre.run('ebook-convert', [ogFile, file]);
    }

    const config = await getConfig();

    // Download annotation set
    const res = await request
      .get(`${constants.XYANNOTATIONS}sets/${setId}/download`)
      .auth('subscription', config.xyfirAnnotationsSubscriptionKey);
    const { set } = res.body;

    // Build extract path
    const folderpath =
      file.substr(0, file.length - 5) +
      ` - Annotated with xyAnnotations (Set #${set.id} v${set.version})`;

    // Extract ebook file
    await new Promise((resolve, reject) =>
      fs
        .createReadStream(file)
        .pipe(unzipper.Extract({ path: folderpath }))
        .on('error', reject)
        .on('finish', resolve)
    );

    // Get files and directories within zip file
    /** @type {string[]} */
    let files = await glob(folderpath + '/**/*');
    const opf = files.find(f => /\.opf$/.test(f));

    // Ignore non-html files
    files = files.filter(f => /html?$/.test(f));

    // Generate markers for main/before set item subsearch matches
    const markers = {};
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const html = await readFile(file);

      // Get markers for chapter
      Object.assign(markers, findMarkers(html, i, set.items));
    }

    // xy folder within the root of the ebook
    const xypath = path.resolve(folderpath, 'xy');

    // Insert annotations into ebook as an added footnotes file
    if (!opf) footnotes = false;
    if (footnotes) {
      // Filter out items without Document annotations
      set.items = set.items.filter(i => {
        i.annotations = i.annotations.filter(a => a.type == 1);
        return i.annotations.length;
      });

      // Footnotes will go in xy/
      await fs.ensureDir(xypath);

      // Write footnotes.html
      await writeFile(
        path.resolve(xypath, 'footnotes.html'),
        TEMPLATES.FOOTNOTES(set)
      );

      // Link file in opf
      let html = await readFile(opf);
      html = html.replace(
        '</manifest>',
        `${TEMPLATES.FOOTNOTES_OPF_MANIFEST(
          path.relative(path.dirname(opf), xypath).replace(/\\/g, '/')
        )}</manifest>`
      );
      html = html.replace(
        '</spine>',
        `${TEMPLATES.FOOTNOTES_OPF_SPINE()}</spine>`
      );
      await writeFile(opf, html);
    }

    // Update HTML files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let html = await readFile(file);

      // Insert links to annotations into file
      html = buildString({
        set,
        html,
        mode: INSERT_MODES[mode.toUpperCase()].LINK,
        action: (type, key) => {
          const item = key.split('-')[1];

          return footnotes
            ? `${path
                .relative(path.dirname(file), xypath)
                .replace(/\\/g, '/')}/footnotes.html#item_${item}`
            : `https://annotations.xyfir.com/sets/${
                set.id
              }/items/${item}?view=true`;
        },
        markers,
        chapter: i
      });

      // Add xyAnnotations notification to titlepage
      if (/title(page)?\.x?html?$/.test(file)) {
        html = html.replace(
          '</body>',
          `${TEMPLATES.NOTIFICATION_FOOTER(set)}</body>`
        );
      }

      await writeFile(file, html);
    }

    // Zip directory to file
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(folderpath + '.epub');
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(folderpath, false);

      archive.finalize();
    });

    // Delete directory
    await fs.remove(folderpath);

    // Delete source files
    if (deleteSource) {
      await fs.remove(file);
      !isEPUB && (await fs.remove(ogFile));
    }

    console.log(folderpath + '.epub');
  } catch (e) {
    console.error(e.toString().red);
    console.error(e);
  }
};
