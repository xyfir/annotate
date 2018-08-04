const CONSTANTS = require('../../constants');
const request = require('superagent');

/**
 * Download annotation set.
 * @param {number} id
 * @param {string} subscriptionKey
 * @param {boolean} [minify]
 * @return {AnnotationSet}
 */
module.exports = async function(id, subscriptionKey, minify) {
  const res = await request
    .get(`${CONSTANTS.XYANNOTATIONS}sets/${id}/download`)
    .query({ minify })
    .auth('subscription', subscriptionKey);
  return res.body.set;
};
