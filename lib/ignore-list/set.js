const writeFile = require('../files/write');

/**
 * Writes new content to data/ignore-list.json.
 * @param {object} data - The ignore list array.
 */
module.exports = async function(data) {
  
  try {
    await writeFile('ignore-list.json', JSON.stringify(data));
  }
  catch (e) {
    throw 'Could not save ignore list file';
  }

}