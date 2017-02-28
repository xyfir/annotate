const fs = require('fs');

/**
 * Loads the content of data/ignore-list.json.
 * @returns {string[]} The parsed ignore list array.
 */
module.exports = async function() {
  
  return await new Promise((resolve, reject) => {
    fs.readFile('data/ignore-list.json', 'utf8', (err, data) => {
      if (err)
        reject('Could not load ignore list file');
      else
        resolve(JSON.parse(data));
    });
  });

}