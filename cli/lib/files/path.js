const path = require('path');

/**
 * Returns the absolute file path for the file.
 * @param {string} file
 * @return {string}
 */
module.exports = function(file) {
  if (path.isAbsolute(file)) return file;

  return path.resolve(
    process.env.APPDATA || process.env.HOME,
    `${process.env.HOME ? '.' : ''}xyfir/`,
    'auto-annotator/',
    file
  );
};
