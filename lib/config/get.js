const fs = require('fs');

/**
 * Loads the content of data/config.json.
 * @returns {object} The parsed config object.
 */
module.exports = async function() {
  
  return await new Promise((resolve, reject) => {
    fs.readFile('data/config.json', 'utf8', (err, data) => {
      if (err)
        reject('Could not load config file');
      else
        resolve(JSON.parse(data));
    });
  });

}