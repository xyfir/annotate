const readFile = require('../files/read');

/**
 * Loads the content of data/ignore-list.json.
 * @returns {string[]} The parsed ignore list array.
 */
module.exports = async function() {
  
  try {
    return JSON.parse(await readFile('ignore-list.json'));
  }
  catch (e) {
    return [];
  }

}