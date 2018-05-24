const getConfig = require('../lib/config/get');
const setConfig = require('../lib/config/set');
const cliTable = require('cli-table');
const fs = require('fs');

/**
 * Based on the options provided, gets or sets config values.
 * @param {yargs} yargs
 */
module.exports = async function(yargs) {
  const argv = yargs.argv;

  try {
    const config = await getConfig();

    // Set value for key
    if (argv.key && argv.value !== undefined) {
      if (config[argv.key] !== undefined) {
        // Convert true/false string to Boolean
        const value =
          argv.value == 'true'
            ? true
            : argv.value == 'false'
              ? false
              : argv.value;

        config[argv.key] = value;

        await setConfig(config);
        console.log('Success');
      } else {
        console.error('Invalid key'.red);
      }
    }
    // Return value for key
    else if (argv.key) {
      if (config[argv.key] !== undefined) console.log(config[argv.key]);
      else console.error('Invalid key'.red);
    }
    // Return all keys/values
    else {
      const output = new cliTable({
        head: ['Key', 'Value'],
        colWidths: [35, 75]
      });

      Object.entries(config).forEach(e => {
        output.push([e[0], e[1]]);
      });

      console.log(output.toString());
    }
  } catch (e) {
    console.log(e.toString().red);
  }
};
