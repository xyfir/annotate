const similarSetsExist = require('../lib/annotations/similar-sets-exist');
const generateSetItems = require('../lib/annotations/generate-items');
const setIgnoreList = require('../lib/ignore-list/set');
const getIgnoreList = require('../lib/ignore-list/get');
const createSet = require('../lib/annotations/create-set');
const getConfig = require('../lib/config/get');
const Calibre = require('node-calibre');
const fs = require('fs');

module.exports = async function(yargs) {

  const argv = yargs.argv;
  
  try {
    const ignoreList = await getIgnoreList();
    const config = await getConfig();
    
    const log = msg => config.logGenerationEvents && console.log(msg.cyan);

    const calibre = new Calibre({
      library: config.calibreLibraryPath, execOptions: {
        cwd: (config.calibreBinPath || null), maxBuffer: 1000000 * 1024
      }
    });

    const lastBookId = +argv.stopAt || 99999999;

    const start = Date.now(), limit = argv.limit;
    const ids = argv.ids ? argv.ids.split(',') : [];
    let loops = 0, misses = 0;
    
    // Loop through books
    for (let i = +argv.startAt || 0; i < lastBookId + 1; i++) {
      // Check if we need to exit the loop
      if (ids.length && ids.indexOf(book.id.toString()) == -1) break;
      if (limit && limit <= loops) break;

      // Check if book is ignored
      if (ignoreList.indexOf(i.toString()) > -1) {
        log(`Skipping book in ignore list`);
        continue;
      }

      // Load book from Calibre
      const book = JSON.parse(
        await calibre.run('calibredb list', [], {
          'for-machine': null,
          'fields': 'authors,formats,id,identifiers,pubdate,publisher,series,'
            + 'series_index,title',
          'search': 'id:' + i
        })
      )[0];

      // Book does not exist with id
      if (!book) {
        // Only allow 20 'misses' if stopAt was not provided
        if (++misses > 20 && !argv.stopAt) break;

        ignoreList.push(i.toString());
        await setIgnoreList(ignoreList);

        continue;
      }
      else {
        misses = 0;
      }

      log('');
      log(`Loading book (${book.id}) ${book.title} - ${book.authors}`);

      // Check for similar matching set
      if (
        (
          config.ignoreBookIfMatchingSetExists ||
          config.skipBookIfMatchingSetExists
        ) && await similarSetsExist(book, config)
      ) {
        if (config.ignoreBookIfMatchingSetExists) {
          ignoreList.push(book.id.toString());
          await setIgnoreList(ignoreList);
          log(`Ignoring book due to similar matching sets`);
        }
        else {
          log(`Skipping book due to similar matching sets`);
        }
        continue;
      }
      
      let format = book.formats.find(f => f.split('.').slice(-1) == 'txt');
      let formatGenerated = false;
      
      // Generate text format
      if (!format) {
        log(`Generating text file`);
        format = book.formats[0];

        if (!format) continue;
        
        let newFormat = format.split('.');
        newFormat[newFormat.length - 1] = 'txt';
        newFormat = newFormat.join('.');

        await calibre.run('ebook-convert', [format, newFormat]);
        format = newFormat, formatGenerated = true;
        log(`Text file generated`);
      }
      
      // Create annotation set with book and config info
      const setId = await createSet(book, config);
      log(`Annotation set ${setId} created`);

      // Read file content, generate items, create items
      log(`Generating annotations, this could take a while`);
      const items = await generateSetItems(setId, book, format, config);
      log(`${items} annotations generated`);
      
      // Add book to ignore list
      ignoreList.push(book.id.toString());
      await setIgnoreList(ignoreList);
      log(`Book added to ignore list`);

      // Act on generated format
      if (formatGenerated) {
        if (config.addGeneratedFormat) {
          await calibre.run('calibredb add_format', [book.id, format]);
          log(`Generated text file added to book as format`);
        }
        else if (config.deleteGeneratedFormat) {
          await new Promise(resolve => {
            fs.unlink(format, err => {
              if (err)
                log(`Could not delete generated text file`);
              else
                log(`Generated text file deleted`);
              
              resolve();
            });
          });
        }
      }

      log(`Book (${book.id}) finished`);
      loops++;
    }

    log(
      `Generation for ${loops} books complete in ${
        Math.round((Date.now() - start) / 1000)
      } seconds.`
    );
  }
  catch (e) {
    console.error(e.toString().red);
  }

}