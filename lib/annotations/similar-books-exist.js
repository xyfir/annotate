const constants = require('../../constants');
const request = require('superagent');

/**
 * Checks if books exist that match the book's title and authors.
 * @async
 * @param {object} book - The book object as retrieved from `calibredb list`.
 * @param {object} config - The config object from `data/config.json`.
 * @return {boolean}
 */
module.exports = async function(book, config) {

  try {
    const res = await request
      .get(constants.XYANNOTATIONS + 'media/books')
      .query({
        title: book.title,
        series: '',
        authors: book.authors,
        accessKey: config.xyfirAnnotationsAccessKey,
      });
    return res.body.books.length > 0;
  }
  catch (err) {
    throw 'Error contacting Xyfir Annotations';
  }

}