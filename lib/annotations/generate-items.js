const createItem = require('./create-item');
const readFile = require('../files/read');
const request = require('superagent');

const constants = require('../../constants');

/**
 * Reads the content of a text file, generates items from that content, and
 * then creates those items.
 * @param {number} setId
 * @param {object} book
 * @param {string} file
 * @param {object} config
 */
module.exports = async function(setId, book, file, config) {

  const content = await readFile(file);

  return new Promise((resolve, reject) => {
    request
      .post(constants.XYANNOTATIONS + 'annotations/generate')
      .query({
        accessKey: config.xyfirAnnotationsAccessKey
      })
      .send({ content })
      .end(async (err, res) => {
        if (err) {
          reject('Error contacting Xyfir Annotations');
          return;
        }
        
        for (item of res.body.items) {
          let prepend = '';

          // Prepend value is generated based on the 
          if (config.addPrependedSearchAnnotation) {
            // One word title, add author name
            // Only add one author
            if (book.title.split(' ').length == 1)
              prepend = book.title + ' ' + book.authors.split('&')[0];
            // Multi word title, ignore subtitle
            else
              prepend = book.title.split(':')[0];
          }
          
          try {
            await createItem(setId, item, config, prepend);
          }
          catch (err) {
            console.error(err.toString().red);
          }
        }

        resolve();
      });
  });

}