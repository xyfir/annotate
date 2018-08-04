const readFile = require('../files/read');
const request = require('superagent');

const constants = require('../../constants');

/**
 * Reads the content of a text file, generates items from that content, and
 * then creates those items.
 * @async
 * @param {number} setId
 * @param {string} file
 * @param {string} accessKey
 * @return {number} The number of items created.
 */
module.exports = async function(setId, file, accessKey) {
  const content = await readFile(file);

  const res = await request
    .post(`${constants.XYANNOTATIONS}sets/${setId}/items/generate`)
    .auth('access', accessKey)
    .send({ content, parser: 'regex', mode: 'create' });

  return res.body.items;
};
