const path = require('lib/files/path');
const fs = require('fs-extra');

/**
 * Writes new content to a file.
 * @param {string} file
 * @param {string|Buffer} data
 * @return {string} The full path to the file.
 */
module.exports = async function(file, data) {
  const fpath = path(file);

  await fs.ensureDir(path(''));
  await fs.writeFile(fpath, data);

  return fpath;
};
