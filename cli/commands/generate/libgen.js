const similarBooksExist = require('lib/xyannotations/similar-books-exist');
const generateSetItems = require('lib/xyannotations/generate-items');
const createObjects = require('lib/xyannotations/create-objects');
const downloadEbook = require('lib/generate/libgen/download');
const writeFile = require('lib/files/write');
const getConfig = require('lib/config/get');
const Calibre = require('node-calibre');
const mysql = require('mysql2/promise');
const fs = require('fs-extra');

/**
 * Using a local Library Genesis database, download books from LibGen.io and
 * generate annotations for the downloaded book.
 * Currently only supports LibGen's fiction database.
 * @param {GenerateLibGenArguments} args
 */
/**
 * @typedef {object} GenerateLibGenArguments
 * @prop {number} [limit]
 * @prop {string} [calibreBinPath]
 * @prop {DatabaseInfo} database
 */
/**
 * @typedef {object} DatabaseInfo
 * @prop {string} [host]
 * @prop {string} [user]
 * @prop {string} [pass]
 * @prop {string} [name]
 * @prop {number} [lastId]
 */
module.exports = async function(args) {
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
    const calibre = new Calibre({
      execOptions: { cwd: args.calibreBinPath || null }
    });

    const cn = await mysql.createConnection(args.database);

    let loops = 0;

    while (true) {
      // Load 100 books from database
      const [books] = await cn.query(sql, [args.lastId]);
      console.log(`${books.length} books loaded from database`);

      if (!books.length) break;

      for (let book of books) {
        if (args.limit && loops >= args.limit) throw 'Limit reached';
        loops++;

        console.log(``);
        console.log(
          `Loading book (${book.id}) ${book.title} - ${book.authors}`
        );

        // Update last id
        args.lastId = book.id;

        // Check if similar book exists
        if (await similarBooksExist(book, config)) {
          console.log(`Skipping book due to similar matching book(s)`);
          continue;
        }

        let buffer = await downloadEbook(book.md5);
        if (!buffer) {
          console.log(`Could not download book. Skipping...`);
          continue;
        }

        // Write temp files to user data directory
        const file1 = await writeFile(Date.now() + '.' + book.ext, buffer);
        const file2 = await writeFile(Date.now() + '.txt', '');
        buffer = null;

        try {
          // Convert to a text file
          await calibre.run('ebook-convert', [file1, file2]);
          console.log(`Ebook converted to a text file`);
        } catch (err) {
          console.log(`Could not convert ebook`);
          await fs.remove(file1);
          await fs.remove(file2);
          continue;
        }

        // Create annotation set with book and config info
        const setId = await createObjects(book, config);
        console.log(`Annotation set ${setId} created`);

        // Read file content, generate items, create items
        console.log(`Generating annotations, this could take a while`);
        const items = await generateSetItems(setId, book, file2, config);
        console.log(`${items} annotations generated`);

        // Delete files
        await fs.remove(file1);
        await fs.remove(file2);
        console.log(`Temporary ebook files deleted`);

        console.log(`Book (${book.id}) finished`);
      }
    }
  } catch (e) {
    console.error(e.toString());
  }
};
