const setIgnoreList = require('../../lib/ignore-list/set');

/**
 * Wipes the ignore list array.
 * @param {object} args
 */
module.exports = async function(args) {
  try {
    await setIgnoreList([]);
    console.log('Success');
  } catch (e) {
    console.error(e.toString());
  }
};
