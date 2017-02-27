const fs = require('fs');

/**
 * Writes new content to data/config.json.
 * @param {object} data - The config object.
 */
module.exports = async function(data) {
  
  return await new Promise((resolve, reject) => {
    fs.writeFile('data/config.json', JSON.stringify(data), (err, data) => {
      if (err)
        reject('Could not save config file');
      else
        resolve();
    });
  });

}