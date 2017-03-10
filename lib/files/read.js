const path = require('path');
const fs = require('fs');

/**
 * Reads a file.
 * @param {string} file - The path / file name to load.
 * @returns {object} The utf8 file content.
 */
module.exports = async function(file) {
  
  file = path.resolve(__dirname, '../../', file);

  return await new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err)
        reject();
      else
        resolve(data);
    });
  });

}