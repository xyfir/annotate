const getIgnoreList = require('../../lib/ignore-list/get');

/**
 * Outputs contents of ignore list.
 * @param {object} args
 */
module.exports = async function(args) {
  try {
    let list = await getIgnoreList();

    if (args.sort) {
      list = list.map(i => +i).sort((a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });
    }

    if (!list.length) console.log('Ignore list is empty');
    else if (args.multiline) list.forEach(id => console.log(id));
    else console.log(list.join(', '));
  } catch (e) {
    console.error(e.toString());
  }
};
