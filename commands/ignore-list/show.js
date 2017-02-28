const getIgnoreList = require('../../lib/ignore-list/get');
const fs = require('fs');

/**
 * Outputs contents of ignore list.
 * @param {yargs} yargs
 */
module.exports = async function(yargs) {

  const argv = yargs.argv;
  
  try {
    const list = await getIgnoreList();
    
    if (!list.length)
      console.log('Ignore list is empty');
    else if (argv.multiline)
      list.forEach(id => console.log(id));
    else
      console.log(list.join(', '));
  }
  catch (e) {
    console.log(e.toString().red);
  }

}