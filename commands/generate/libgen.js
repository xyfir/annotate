const similarSetsExist = require('lib/annotations/similar-sets-exist');
const generateSetItems = require('lib/annotations/generate-items');
const createSet = require('lib/annotations/create-set');
const writeFile = require('lib/files/write');
const getConfig = require('lib/config/get');
const setConfig = require('lib/config/set');
const DOMParser = require('xmldom').DOMParser;
const readFile = require('lib/files/read');
const Calibre = require('node-calibre');
const request = require('superagent');
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
      Title AS title, Series1 AS series,
      ID AS id, MD5 AS md5, Extension AS ext,
      AuthorFamily1 AS authorLast1, AuthorName1 AS authorFirst1,
      AuthorFamily2 AS authorLast2, AuthorName2 AS authorFirst2,
      AuthorFamily3 AS authorLast3, AuthorName3 AS authorFirst3,
      AuthorFamily4 AS authorLast4, AuthorName4 AS authorFirst4
    FROM main
    WHERE
      ID > ? AND
      Filesize < 10000001 AND
      Extension IN ('epub', 'mobi') AND
      AuthorFamily1 != '' AND AuthorName1 != '' AND
      Language REGEXP '[[:<:]](English)|(english)|(eng)|(en)[[:>:]]'
    ORDER BY ID ASC
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

    const domParser = new DOMParser({ errorHandler: () => 1 });

    let loops = 0;

    while (true) {
      // Load 100 books from database
      const [books] = await cn.query(sql, [config.libgenLastId]);
      log(`${books.length} books loaded from database`);

      if (!books.length) break;

      for (let book of books) {
        if (argv.limit && loops >= argv.limit) throw 'Limit reached';
        loops++;

        // Build 'authors' prop
        book.authors = [];
        for (let i = 1; i < 5; i++) {
          book.authors.push(
            (book['authorFirst' + i] + ' ' + book['authorLast' + i]).trim()
          );
        }
        book.authors = book.authors.filter(a => !!a).join(' & ');

        log(``);
        log(`Loading book (${book.id}) ${book.title} - ${book.authors}`);

        // Update last id
        config.libgenLastId = book.id;
        await setConfig(config);

        // Check if similar set exists
        if (
          (
            config.ignoreBookIfMatchingSetExists ||
            config.skipBookIfMatchingSetExists
          ) &&
          await similarSetsExist(book, config)
        ) {
          log(`Skipping book due to similar matching sets`);
          continue;
        }

        // Download page from LibGen that will give us the actual download link
        let dl = await request
          .get('http://libgen.io/foreignfiction/ads.php?md5=' + book.md5);
        log(`Finding download link from LibGen`);
        
        // Download the actual file as a buffer
        dl = await request
          .get(
            domParser
              .parseFromString(dl.text)
              .getElementsByTagName('a')[1]
              .attributes[0]
              .value
          )
          .buffer(true)
          .parse(request.parse['application/octet-stream']);
        log(`Ebook file downloaded. Writing to disk...`);

        // Write temp files to user data directory
        const file1 = await writeFile(Date.now() + '.' + book.ext, dl.body);
        const file2 = await writeFile(Date.now() + '.txt', '');

        // Convert to a text file
        await calibre.run('ebook-convert', [file1, file2]);
        log(`Ebook converted to a text file`);

        // Create annotation set with book and config info
        const setId = await createSet(book, config);
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