const {
  findMarkers,
  buildString,
  INSERT_MODES
} = require('@xyfir/annotate-html');
const downloadSet = require('lib/xyannotations/download-set');
const TEMPLATES = require('lib/convert/embedded/templates');
const writeFile = require('lib/files/write');
const readFile = require('lib/files/read');
const unzipper = require('unzipper');
const archiver = require('archiver');
const Calibre = require('node-calibre');
const util = require('util');
const glob = util.promisify(require('glob'));
const path = require('path');
const fs = require('fs-extra');

/**
 * @typedef {object} Arguments
 * @prop {string} subscriptionKey
 * @prop {boolean} [deleteSource]
 * @prop {boolean} [footnotes]
 * @prop {string} [mode] - `"wrap" | "reference"`
 * @prop {string} file
 * @prop {number} set
 */
/**
 * Insert annotations into an ebook file using links wrapped around search
 *  matches that point to the xyAnnotations item viewer.
 * @param {Arguments} args
 */
module.exports = async function(args) {
  const {
    subscriptionKey,
    deleteSource,
    mode = 'REFERENCE',
    set: setId
  } = args;
  let { file, footnotes } = args;
  file = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);

  try {
    const isEPUB = /\.epub$/.test(file);

    if (!setId) throw 'Missing `--set <id>`';
    if (!file) throw 'Missing `--file <path>`';

    // Convert non-epub file to epub
    let ogFile = '';
    if (!isEPUB) {
      const calibre = new Calibre({});

      ogFile = file;
      file += '.epub';

      await calibre.run('ebook-convert', [ogFile, file]);
    }

    // Download annotation set
    const set = await downloadSet(setId, subscriptionKey);

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
      // Footnotes will go in xy/
      await fs.ensureDir(xypath);

      // Split footnote files every ~300KB for performance reasons
      let entries = '';
      let footnotes = 0;
      for (let i = 0; i < set.items.length; i++) {
        const item = set.items[i];
        item.footnote = footnotes;
        entries += TEMPLATES.FOOTNOTES_ENTRY(item) + '\n\n<hr/><hr/><hr/>';

        // Write file if entries are too big or if there are no items left
        if (entries.length >= 300000 || i == set.items.length - 1) {
          await writeFile(
            path.resolve(xypath, `footnotes-${footnotes}.html`),
            TEMPLATES.FOOTNOTES_CONTAINER(set, entries)
          );
          footnotes++;
          entries = '';
        }
      }

      // Link footnote files in OPF
      let html = await readFile(opf);
      html = html.replace(
        '</manifest>',
        `${TEMPLATES.FOOTNOTES_OPF_MANIFEST(
          TEMPLATES.FOOTNOTES_PATH(opf, xypath),
          footnotes
        )}</manifest>`
      );
      html = html.replace(
        '</spine>',
        `${TEMPLATES.FOOTNOTES_OPF_SPINE(footnotes)}</spine>`
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
          // Get item object for footnote index
          const id = +key.split('-')[1];
          const item = set.items.find(item => item.id == id);

          return footnotes
            ? `${TEMPLATES.FOOTNOTES_PATH(file, xypath)}/footnotes-${
                item.footnote
              }.html#item_${item.id}`
            : `https://annotations.xyfir.com/sets/${set.id}/items/${
                item.id
              }?view=true`;
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
    console.error(e);
  }
};
