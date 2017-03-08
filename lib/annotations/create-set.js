const request = require('superagent');

const constants = require('../../constants');

/**
 * Creates an annotation set with the book's metadata.
 * @param {object} book - The book object as retrieved from `calibredb list`.
 * @param {object} config - The config object from `data/config.json`.
 * @returns {number} The id of the newly created annotation set.
 */
module.exports = async function(book, config) {

  return await new Promise((resolve, reject) => {
    let bookMeta = {};

    if (book.series) {
      bookMeta['Series'] = book.series;

      book.series_index && (bookMeta['Series Index'] = book.series_index);
    }

    book.identifiers && (bookMeta['Identifiers'] = book.identifiers);
    book.publisher && (bookMeta['Publisher'] = book.publisher);
    book.pubdate && (bookMeta['Published'] = book.pubdate.split('T')[0]);

    bookMeta = JSON.stringify(bookMeta);

    request
      .post(constants.XYANNOTATIONS + 'sets')
      .query({
        accessKey: config.xyfirAnnotationsAccessKey
      })
      .send({
        bookTitle: book.title, bookAuthors: book.authors, bookMeta,
        setDescription: config.annotationSetDescription,
        setTitle: config.annotationSetTitle
      })
      .end((err, res) => {
        if (err)
          reject('Error contacting Xyfir Annotations');
        else if (res.body.error)
          reject('xyAnnotations Error: ' + res.body.message);
        else
          resolve(res.body.id);
      });
  });

}