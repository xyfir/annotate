const getConfig = require('../lib/config/get');
const setConfig = require('../lib/config/set');

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
        console.error('Invalid key');
      }
    }
    // Return value for key
    else if (argv.key) {
      if (config[argv.key] !== undefined) console.log(config[argv.key]);
      else console.error('Invalid key');
    }
    // Return all keys/values
    else {
      console.log(config);
    }
  } catch (e) {
    console.error(e.toString());
  }
};
