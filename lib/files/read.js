const path = require('path');
const util = require('util');
const fs = require('fs');

fs.readFile = util.promisify(fs.readFile);

/**
 * Reads a file.
 * @param {string} file - The path / file name to load.
 * @param {boolean} [absolute=false] - If true, `file` is treated as an 
 * absolute path and not a file in the app data folder.
 * @returns {object} The utf8 file content.
 */
module.exports = async function(file, absolute = false) {
  
  if (absolute)
    file = file;
  else if (process.env.APPDATA)
    file = path.resolve(process.env.APPDATA, 'auto-annotator/', file);
  else
    file = path.resolve(process.env.HOME, '.auto-annotator/', file);

  return fs.readFile(file, 'utf8');

}