const fs = require('fs');

/**
 * Writes new content to data/ignore-list.json.
 * @param {object} data - The ignore list array.
 */
module.exports = async function(data) {
  
  return await new Promise((resolve, reject) => {
    fs.writeFile(
      'data/ignore-list.json', JSON.stringify(data),
      (err, data) => {
        if (err)
          reject('Could not save ignore list file');
        else
          resolve();
      }
    );
  });

}