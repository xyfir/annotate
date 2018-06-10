const getConfig = require('lib/config/get');
const writeFile = require('lib/files/write');
const constants = require('../constants');
const Annotate = require('@xyfir/annotate-html').default;
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
 * @prop {boolean} [convert]
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
  const { deleteSource, convert, set: setId } = yargs.argv;
  let { file } = yargs.argv;
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
    const path =
      file.substr(0, file.length - 5) +
      ` - Annotated with xyAnnotations (Set #${set.id} v${set.version})`;

    // Extract ebook file
    await new Promise((resolve, reject) =>
      fs
        .createReadStream(file)
        .pipe(unzipper.Extract({ path }))
        .on('error', reject)
        .on('finish', resolve)
    );

    // Get files and directories within zip file
    /** @todo Use TOC */
    /** @type {string[]} */
    let files = await glob(path + '/**/*');

    // Ignore non-html files
    files = files.filter(f => /html$/.test(f));

    // Generate markers for main/before set item subsearch matches
    const markers = {};
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const html = await readFile(file);

      // Get markers for chapter
      Object.assign(markers, Annotate.findMarkers(html, i, set.items));
    }

    // Update HTML files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let html = await readFile(file);

      // Insert annotations into file
      html = Annotate.insertAnnotations({
        set,
        html,
        mode: 'link',
        action: (type, key) =>
          `https://annotations.xyfir.com/sets/${key.split('-')[0]}/items/${
            key.split('-')[1]
          }?view=true`,
        markers,
        chapter: i
      });

      // Add xyAnnotations notification to bottom of first and last file
      // !! First and last is alphabetical and may not be proper order of book
      if (i == 0 || i == files.length - 1) {
        html = html.replace(
          '</body>',
          `<footer class="xyannotations-notification">
          <p>
            This book has been annotated via
            <a href="https://annotations.xyfir.com">xyAnnotations</a>,
            using annotation set
            <a href="https://annotations.xyfir.com/sets/${setId}">#${setId}</a>
            on <code>${new Date(set.version).toGMTString()}</code>.
          </p>
          <p>
            You can update or remove this file's annotations
            <a href="https://annotations.xyfir.com/annotate-my-ebook?set=${
              set.id
            }">here</a>.
          </p>
        </footer>
        </body>`
        );
      }

      await writeFile(file, html);
    }

    // Zip directory to file
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(path + '.epub');
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(path, false);

      archive.finalize();
    });

    // Delete directory
    await fs.remove(path);

    // Delete source files
    if (deleteSource) {
      await fs.remove(file);
      !isEPUB && (await fs.remove(ogFile));
    }

    console.log(path + '.epub');
  } catch (e) {
    console.error(e.toString().red);
    console.error(e);
  }
};
