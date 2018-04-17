const writeFile = require('../files/write');

/**
 * Writes new content to data/config.json.
 * @param {object} data - The config object.
 */
module.exports = async function(data) {
  try {
    await writeFile('config.json', JSON.stringify(data));
  } catch (e) {
    console.log(e);
    throw 'Could not save config file';
  }
};
