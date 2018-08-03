const setIgnoreList = require('../../lib/ignore-list/set');
const getIgnoreList = require('../../lib/ignore-list/get');
const fs = require('fs');

/**
 * Removes book ids from list.
 * @param {yargs} yargs
 */
module.exports = async function(yargs) {
  const argv = yargs.argv;

  try {
    if (!argv.ids) throw 'Missing values for --ids';

    const ids = String(argv.ids).split(',');
    let list = await getIgnoreList();
    list = list.filter(id => ids.indexOf(id) == -1);

    await setIgnoreList(list);
    console.log('Success');
  } catch (e) {
    console.error(e.toString());
  }
};
