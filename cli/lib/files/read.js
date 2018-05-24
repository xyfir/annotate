const path = require('lib/files/path');
const fs = require('fs-extra');

/**
 * Reads a file.
 * @async
 * @param {string} file - The path / file name to load.
 * @return {string} The utf8 file content.
 */
module.exports = function(file) {
  return fs.readFile(path(file), 'utf8');
};
