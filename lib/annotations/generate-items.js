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

  const res = await request
    .post(`${constants.XYANNOTATIONS}sets/${setId}/items/generate`)
    .query({ accessKey: config.xyfirAnnotationsAccessKey })
    .send({ content, parser: 'regex', mode: 'create' });

  return res.body.items;
};
