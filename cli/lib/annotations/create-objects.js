const constants = require('../../constants');
const request = require('superagent');

const TITLE = (bt, ba) =>
  `Generated Annotations for ${bt.substr(0, 135)} by ${ba.substr(0, 135)}`;
const SUMMARY = (bt, ba) =>
  `Automatically generated annotations for ` +
  `${bt.substr(0, 227)} by ${ba.substr(0, 227)}.`;

/**
 * Creates the following objects on xyAnnotations: a book, an annotation set,
 *  and links both using the book's metadata.
 * @async
 * @param {object} book - The book object as retrieved from `calibredb list`.
 * @param {object} config - The config object from `data/config.json`.
 * @return {number} The id of the newly created annotation set.
 */
module.exports = async function(book, config) {
  let res;

  try {
    // Create book
    res = await request
      .post(constants.XYANNOTATIONS + 'media/books')
      .auth('access', config.xyfirAnnotationsAccessKey)
      .send({
        title: book.title.substr(0, 500),
        series: book.series ? book.series.substr(0, 500) : undefined,
        authors: book.authors.substr(0, 500),
        language: 'eng', // ** Remove this / pull from book
        published: book.pubdate,
        publisher: book.publisher,
        identifiers:
          typeof book.identifiers == 'object' ? book.identifiers : undefined
      });

    const bookId = +res.body.id;

    // Create set + link book and set
    res = await request
      .post(constants.XYANNOTATIONS + 'sets')
      .auth('access', config.xyfirAnnotationsAccessKey)
      .send({
        language: 'eng', // ** Remove this / pull from book
        summary: SUMMARY(book.title, book.authors),
        public: true,
        title: TITLE(book.title, book.authors),
        media: {
          books: [bookId]
        }
      });

    return +res.body.id;
  } catch (err) {
    throw 'Error contacting Xyfir Annotations';
  }
};
