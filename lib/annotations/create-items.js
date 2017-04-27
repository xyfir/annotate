const request = require('superagent');

const constants = require('../../constants');

/**
 * Creates items for an annotation set.
 * @param {number} setId
 * @param {string[]} item
 * @param {object} config
 * @param {string} [prepend]
 */
module.exports = function(setId, items, config, prepend) {

  const createItems = items.map(value => {
    // Annotation name/title limited to 50 characters
    const title = value.length > 38 ? value.substr(0, 38) + '...' : value;

    const item = {
      title, object: {
        find: [{
          text: value, regex: false, range: {
            global: true, before: '', after: ''
          }
        }],
        annotations: [{
          type: 3, name: 'Search - ' + title, value
        }]
      }
    };

    if (prepend) {
      item.object.annotations.push({
        type: 3, name: 'Search with prepend',
        value: prepend + ' ' + value
      });
    }

    item.object = JSON.stringify(item.object);

    return item;
  });

  return new Promise((resolve, reject) => {
    request
      .post(`${constants.XYANNOTATIONS}sets/${setId}/items`)
      .query({
        accessKey: config.xyfirAnnotationsAccessKey
      })
      .send({ items: JSON.stringify(createItems) })
      .end((err, res) => {
        if (err)
          reject('Error contacting Xyfir Annotations');
        else if (res.body.error && !res.body.ids.length)
          reject('xyAnnotations Error: ' + res.body.message);
        else
          resolve(res.body.ids.length);
      });
  });

}