const readFile = require('../files/read');
const config = require('./default.json');

/**
 * Loads the content of data/config.json.
 * @returns {object} The parsed config object.
 */
module.exports = async function() {
  
  try {
    return Object.assign(
      {}, config, JSON.parse(await readFile('config.json'))
    );
  }
  catch (e) {
    return config;
  }

}