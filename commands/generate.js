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
    const config = await getConfig();
    const ignoreList = await getIgnoreList();
    
    const log = msg => config.logGenerationEvents && console.log(msg.cyan);

    const calibre = new Calibre({
      library: config.calibreLibraryPath, execOptions: {
        cwd: (config.calibreBinPath || null)
      }
    });
    
    // Load book list from Calibre
    const books = JSON.parse(
      await calibre.run('calibredb list', [], {
        'for-machine': null,
        'fields': 'authors,formats,id,identifiers,pubdate,publisher,series,'
          + 'series_index,title'
      })
    );

    const start = Date.now(), limit = argv.limit;
    let loops = 0;
    
    // Loop through books
    for (book of books) {
      if (limit && limit <= loops) break;

      log('');
      log(`Loading book (${book.id}) ${book.title} - ${book.authors}`);

      // Check if book is ignored
      if (ignoreList.indexOf(book.id.toString()) > -1) {
        log(`Skipping book in ignore list`);
        continue;
      }

      // Check for similar matching set
      if (
        config.ignoreBookIfMatchingSetExists
        && await similarSetsExist(book, config)
      ) {
        log(`Skipping book due to similar matching sets`);
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
      await generateSetItems(setId, book, format, config);
      log(`Annotations generated`);
      
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
          fs.unlink(format, err => {
            if (err)
              log(`Could not delete generated text file`);
            else
              log(`Generated text file deleted`);
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