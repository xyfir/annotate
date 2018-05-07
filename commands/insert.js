const getConfig = require('../lib/config/get');
const writeFile = require('lib/files/write');
const constants = require('../constants');
const Annotate = require('@xyfir/annotate-html').default;
const readFile = require('lib/files/read');
const unzipper = require('unzipper');
const archiver = require('archiver');
const request = require('superagent');
const util = require('util');
const glob = util.promisify(require('glob'));
const fs = require('fs-extra');

/**
 * Based on the options provided, gets or sets config values.
 * @param {yargs} yargs
 */
module.exports = async function(yargs) {
  /** @type {string} */
  const file = yargs.argv.file;
  /** @type {number} */
  const setId = yargs.argv.set;

  try {
    if (!setId) throw 'Missing `--set`';
    if (!file) throw 'Missing `--file`';
    if (!/\.epub$/.test(file)) throw 'Only `.epub` files supported';

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

    console.log(path + '.epub');
  } catch (e) {
    console.error(e.toString().red);
    console.error(e);
  }
};
