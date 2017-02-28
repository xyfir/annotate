const setIgnoreList = require('../../lib/ignore-list/set');
const getIgnoreList = require('../../lib/ignore-list/get');
const fs = require('fs');

/**
 * Adds book ids to ignore list.
 * @param {yargs} yargs
 */
module.exports = async function(yargs) {

  const argv = yargs.argv;

  try {
    if (!argv.ids) throw 'Missing values for --ids';

    // ignore duplicate ids
    const ids = String(argv.ids).split(',');
    let list = await getIgnoreList();
    list = list.concat(ids);

    await setIgnoreList(list);
    console.log('Success'.green);
  }
  catch (e) {
    console.error(e.toString().red);
  }

}