const setIgnoreList = require('../../lib/ignore-list/set');
const fs = require('fs');

/**
 * Wipes the ignore list array.
 * @param {yargs} yargs
 */
module.exports = async function(yargs) {
  yargs.argv;

  try {
    await setIgnoreList([]);
    console.log('Success'.green);
  } catch (e) {
    console.error(e.toString().red);
  }
};
