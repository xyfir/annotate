const request = require('superagent');

const constants = require('../../constants');

/**
 * Checks if annotation sets exist that match the book's title and authors.
 * @async
 * @param {object} book - The book object as retrieved from `calibredb list`.
 * @param {object} config - The config object from `data/config.json`.
 * @return {boolean} True if similar set(s) exist.
 */
module.exports = async function(book, config) {

  try {
    const res = await request
      .get(constants.XYANNOTATIONS + 'sets')
      .query({
        sort: 'top', bookTitle: book.title, bookAuthors: book.authors,
        title: '', accessKey: config.xyfirAnnotationsAccessKey,
        direction: 'desc'
      });
    return !!res.body.sets.length;
  }
  catch (err) {
    throw 'Error contacting Xyfir Annotations';
  }

}