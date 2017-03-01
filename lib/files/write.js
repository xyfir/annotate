const fs = require('fs');

/**
 * Writes new content to a file.
 * @param {string} file - The file / path name to write to.
 * @param {string} data - The data to write to the file.
 */
module.exports = async function(file, data) {
  
  return await new Promise((resolve, reject) => {
    fs.writeFile(file, data, (err, data) => {
      if (err)
        reject();
      else
        resolve();
    });
  });

}