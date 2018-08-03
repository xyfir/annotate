const getConfig = require('lib/config/get');
const CONSTANTS = require('../../constants');
const request = require('superagent');

/**
 * Download annotation set.
 * @param {number} id
 * @param {boolean} [minify]
 * @return {AnnotationSet}
 */
module.exports = async function(id, minify) {
  const config = await getConfig();
  const res = await request
    .get(`${CONSTANTS.XYANNOTATIONS}sets/${id}/download`)
    .query({ minify })
    .auth('subscription', config.xyfirAnnotationsSubscriptionKey);
  return res.body.set;
};
