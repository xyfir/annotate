const setIgnoreList = require('../../lib/ignore-list/set');
const getIgnoreList = require('../../lib/ignore-list/get');

/**
 * Adds book ids to ignore list.
 * @param {object} args
 */
module.exports = async function(args) {
  try {
    if (!args.ids) throw 'Missing values for --ids';

    let list = await getIgnoreList();

    const ids = String(args.ids)
      .split(',')
      .filter(id => {
        return list.indexOf(id) == -1;
      });

    list = list.concat(ids);

    await setIgnoreList(list);
    console.log('Success');
  } catch (e) {
    console.error(e.toString());
  }
};
