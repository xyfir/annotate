const path = require('path');
const util = require('util');
const fs = require('fs');

fs.writeFile = util.promisify(fs.writeFile),
fs.mkdir = util.promisify(fs.mkdir);

/**
 * Writes new content to a file.
 * @param {string} file - The file / path name to write to.
 * @param {string|Buffer} data - The data to write to the file.
 * @returns {string} The full path to the file.
 */
module.exports = async function(file, data) {

  const dir = process.env.APPDATA
    ? path.resolve(process.env.APPDATA, 'auto-annotator')
    : path.resolve(process.env.HOME, '.auto-annotator');
  file = path.resolve(dir, file);

  try {
    await fs.writeFile(file, data);
  }
  catch (err) {
    await fs.mkdir(dir);
    await fs.writeFile(file, data);
  }

  return file;

}