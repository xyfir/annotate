const request = require('superagent');

const constants = require('../../constants');

/**
 * Checks if annotation sets exist that match the book's title and authors.
 * @param {object} book - The book object as retrieved from `calibredb list`.
 * @param {object} config - The config object from `data/config.json`.
 * @returns {boolean} True if similar set(s) exist.
 */
module.exports = async function(book, config) {

  return await new Promise((resolve, reject) => {
    request
      .get(constants.XYANNOTATIONS + 'sets')
      .query({
        sort: 'top', bookTitle: book.title, bookAuthors: book.authors,
        setTitle: '', accessKey: config.xyfirAnnotationsAccessKey
      })
      .end((err, res) => {
        if (err)
          reject('Error contacting Xyfir Annotations');
        else
          resolve(!!res.body.sets.length);
      });
  });

}