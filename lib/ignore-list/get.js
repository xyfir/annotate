const readFile = require('../files/read');

/**
 * Loads the content of data/ignore-list.json.
 * @returns {string[]} The parsed ignore list array.
 */
module.exports = async function() {
  
  try {
    return JSON.parse(await readFile('data/ignore-list.json'));
  }
  catch (e) {
    throw 'Could not load ignore list file';
  }

}