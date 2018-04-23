const constants = require('../../constants');
const request = require('superagent');

const TITLE = (bt, ba) =>
  `Generated Annotations for ${bt.substr(0, 235)} by ${ba.substr(0, 235)}`;
const DESCRIPTION = (bt, ba) =>
  `Automatically generated annotations for **${bt}** by **${ba}**.`;

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
      .query({
        accessKey: config.xyfirAnnotationsAccessKey
      })
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
      .query({
        accessKey: config.xyfirAnnotationsAccessKey
      })
      .send({
        description: DESCRIPTION(book.title, book.authors),
        language: 'eng', // ** Remove this / pull from book
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
