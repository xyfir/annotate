const readFile = require('../files/read');
const request = require('superagent');

const constants = require('../../constants');

/**
 * Reads the content of a text file, generates items from that content, and
 * then creates those items.
 * @async
 * @param {number} setId
 * @param {object} book
 * @param {string} file
 * @param {object} config
 * @return {number} The number of items created.
 */
module.exports = async function(setId, book, file, config) {

  const content = await readFile(file);

  let context = '';

  if (config.addSearchAnnotationContext) {
    // One word title, add author name
    // Only add one author
    if (book.title.split(' ').length == 1)
      context = book.title + ' ' + book.authors.split('&')[0];
    // Multi word title, ignore subtitle
    else
      context = book.title.split(':')[0];
  }

  const res = await request
    .post(`${constants.XYANNOTATIONS}sets/${setId}/items/generate`)
    .query({ accessKey: config.xyfirAnnotationsAccessKey })
    .send({ content, context, parser: 'regex', mode: 'create' });

  return res.body.items;

}