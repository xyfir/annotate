const request = require('superagent');

const constants = require('../../constants');

/**
 * Reads the content of a text file, generates items from that content, and
 * then creates those items.
 * @param {number} setId
 * @param {string} item
 * @param {object} config
 * @param {string} [prepend]
 */
module.exports = function(setId, item, config, prepend) {

  // Annotation name/title limited to 50 characters
  const title = item.length > 38 ? item.substr(0, 38) + '...' : item;

  const obj = {
    find: [{
      text: item, regex: false, range: {
        global: true, before: '', after: ''
      }
    }],
    annotations: [{
      type: 3, name: 'Search - ' + title, value: item
    }]
  };

  if (prepend) {
    obj.annotations.push({
      type: 3, name: 'Search with prepend',
      value: prepend + ' ' + item
    });
  }

  return new Promise((resolve, reject) => {
    request
      .post(`${constants.XYANNOTATIONS}sets/${setId}/items`)
      .query({
        accessKey: config.xyfirAnnotationsAccessKey
      })
      .send({
        title, object: JSON.stringify(obj)
      })
      .end((err, res) => {
        if (err)
          reject('Error contacting Xyfir Annotations');
        else if (res.body.error)
          reject('xyAnnotations Error: ' + res.body.message);
        else
          resolve();
      });
  });

}