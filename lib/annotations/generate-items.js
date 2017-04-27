const createItems = require('./create-items');
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
 * @returns {Promise} Resolves to the number of items created.
 */
module.exports = async function(setId, book, file, config) {

  const content = await readFile(file);

  return new Promise((resolve, reject) =>
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

        let prepend = '', index = 0;

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

        // Create up to 100 items at once
        while (res.body.items[index]) {
          try {
            const created = await createItems(
              setId, res.body.items.slice(index, index + 100), config, prepend
            );
            index += created;
          }
          catch (err) {
            console.error(err.toString().red);
          }
        }

        resolve(index);
      })
  );

}