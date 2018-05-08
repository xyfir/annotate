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
      .query({ subscriptionKey: config.xyfirAnnotationsSubscriptionKey });
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
    /** @type {string[]} */
    const files = await glob(path + '/**/*');

    // Generate markers for main/before set item subsearch matches
    const markers = {};
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Ignore non-html files
      if (!/\html$/.test(file)) continue;

      const html = await readFile(file);

      // Get markers for chapter
      Object.assign(markers, Annotate.findMarkers(html, i, set.items));
    }

    // Update HTML files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Ignore non-html files
      if (!/\html$/.test(file)) continue;

      const html = await readFile(file);

      await writeFile(
        file,
        Annotate.insertAnnotations({
          set,
          mode: 'link',
          html: html,
          action: (type, key) =>
            `https://annotations.xyfir.com/sets/${key.split('-')[0]}/items/${
              key.split('-')[1]
            }?view=true`,
          markers,
          chapter: i
        })
      );
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
