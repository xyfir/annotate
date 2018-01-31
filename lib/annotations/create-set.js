const request = require('superagent');

const constants = require('../../constants');

/**
 * Creates an annotation set with the book's metadata.
 * @async
 * @param {object} book - The book object as retrieved from `calibredb list`.
 * @param {object} config - The config object from `data/config.json`.
 * @return {number} The id of the newly created annotation set.
 */
module.exports = async function(book, config) {

  let bookMeta = {};

  if (book.series) {
    bookMeta['Series'] = book.series;

    book.series_index && (bookMeta['Series Index'] = book.series_index);
  }

  if (book.identifiers) {
    // Calibre 3 is an object, 2 is a string
    if (typeof book.identifiers == 'object') {
      bookMeta['Identifiers'] = Object
        .keys(book.identifiers)
        .map(k =>
          k[0].toUpperCase() + k.slice(1) + ': ' + book.identifiers[k]
        )
        .join(', ');
    }
    else {
      bookMeta['Identifiers'] = book.identifiers
        .split(',')
        .map(id => id[0].toUpperCase() + id.slice(1).replace(':', ': '))
        .join(', ');
    }
  }

  book.publisher && (bookMeta['Publisher'] = book.publisher);
  book.pubdate && (bookMeta['Published'] = book.pubdate.split('T')[0]);

  bookMeta = JSON.stringify(bookMeta);

  let res;

  try {
    res = await request
      .post(constants.XYANNOTATIONS + 'sets')
      .query({
        accessKey: config.xyfirAnnotationsAccessKey
      })
      .send({
        bookTitle: book.title.substr(0, 500), bookMeta,
        description: config.annotationSetDescription,
        bookAuthors: book.authors.substr(0, 500),
        title: config.annotationSetTitle
      });
  }
  catch (err) {
    throw 'Error contacting Xyfir Annotations';
  }

  if (res.body.error) throw 'xyAnnotations Error: ' + res.body.message;

  return res.body.id;

}