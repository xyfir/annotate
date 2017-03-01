const readFile = require('../files/read');

/**
 * Loads the content of data/config.json.
 * @returns {object} The parsed config object.
 */
module.exports = async function() {
  
  try {
    return JSON.parse(await readFile('data/config.json'));
  }
  catch (e) {
    throw 'Could not load config file';
  }

}