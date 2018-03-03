const similarBooksExist = require('lib/annotations/similar-books-exist');
const generateSetItems = require('lib/annotations/generate-items');
const createObjects = require('lib/annotations/create-objects');
const downloadEbook = require('lib/ebooks/download');
const writeFile = require('lib/files/write');
const getConfig = require('lib/config/get');
const setConfig = require('lib/config/set');
const readFile = require('lib/files/read');
const Calibre = require('node-calibre');
const mysql = require('mysql2/promise');
const util = require('util');
const fs = require('fs');

fs.unlink = util.promisify(fs.unlink);

/**
 * Using a local Library Genesis database, download books from LibGen.io and
 * generate annotations for the downloaded book.
 * Currently only supports LibGen's fiction database.
 * @param {object} yargs
 * @param {object} yargs.argv
 * @param {number} [yargs.argv.limit]
 */
module.exports = async function(yargs) {

  const argv = yargs.argv;

  const sql = `
    SELECT
      id, title, author AS authors, series, md5, extension AS ext
    FROM updated_edited
    WHERE
      id > ? AND
      filesize < 100000001 AND
      author != '' AND title != '' AND
      extension IN ('epub', 'mobi') AND
      Language REGEXP '[[:<:]](English)|(english)|(eng)|(en)[[:>:]]'
    ORDER BY id ASC
    LIMIT 100
  `;

  try {
    const config = await getConfig();

    const log = msg => config.logGenerationEvents && console.log(msg.cyan);

    const calibre = new Calibre({
      execOptions: { cwd: config.calibreBinPath || null }
    });

    const cn = await mysql.createConnection({
      host: config.libgenDatabaseHost, user: config.libgenDatabaseUser,
      database: config.libgenDatabaseName, password: config.libgenDatabasePass
    });

    let loops = 0;

    while (true) {
      // Load 100 books from database
      const [books] = await cn.query(sql, [config.libgenLastId]);
      log(`${books.length} books loaded from database`);

      if (!books.length) break;

      for (let book of books) {
        if (argv.limit && loops >= argv.limit) throw 'Limit reached';
        loops++;

        log(``);
        log(`Loading book (${book.id}) ${book.title} - ${book.authors}`);

        // Update last id
        config.libgenLastId = book.id;
        await setConfig(config);

        // Check if similar book exists
        if (
          (config.ignoreBookIfMatchExists || config.skipBookIfMatchExists) &&
          await similarBooksExist(book, config)
        ) {
          log(`Skipping book due to similar matching book(s)`);
          continue;
        }

        let buffer = await downloadEbook(book.md5);
        if (!buffer) {
          log(`Could not download book. Skipping...`);
          continue;
        }

        // Write temp files to user data directory
        const file1 = await writeFile(Date.now() + '.' + book.ext, buffer);
        const file2 = await writeFile(Date.now() + '.txt', '');
        buffer = null;

        try {
          // Convert to a text file
          await calibre.run('ebook-convert', [file1, file2]);
          log(`Ebook converted to a text file`);
        }
        catch (err) {
          log(`Could not convert ebook`);
          await fs.unlink(file1);
          await fs.unlink(file2);
          continue;
        }

        // Create annotation set with book and config info
        const setId = await createObjects(book, config);
        log(`Annotation set ${setId} created`);

        // Read file content, generate items, create items
        log(`Generating annotations, this could take a while`);
        const items = await generateSetItems(setId, book, file2, config);
        log(`${items} annotations generated`);

        // Delete files
        await fs.unlink(file1);
        await fs.unlink(file2);
        log(`Temporary ebook files deleted`);

        log(`Book (${book.id}) finished`);
      }
    }
  }
  catch (e) {
    console.error(e.toString().red);
  }

}