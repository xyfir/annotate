const path = require('path');
const fs = require('fs');

/**
 * Writes new content to a file.
 * @param {string} file - The file / path name to write to.
 * @param {string} data - The data to write to the file.
 */
module.exports = async function(file, data) {

  const dir = process.env.APPDATA
    ? path.resolve(process.env.APPDATA, 'auto-annotator')
    : path.resolve(process.env.HOME, '.auto-annotator');
  file = path.resolve(dir, file);
  
  return await new Promise((resolve, reject) => {
    // Attempt to write file
    fs.writeFile(file, data, err => {
      // Assume directory doesn't exist, attempt to create it
      if (err) {
        fs.mkdir(dir, err => {
          if (err)
            reject();
          // Attempt to create file in new directory
          else
            fs.writeFile(file, data, err => err ? reject() : resolve());
        });
      }
      else {
        resolve();
      }
    });
  });

}