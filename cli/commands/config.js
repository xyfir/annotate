const getConfig = require('../lib/config/get');
const setConfig = require('../lib/config/set');

/**
 * Based on the options provided, gets or sets config values.
 * @param {ConfigArguments} args
 */
/**
 * @typedef {object} ConfigArguments
 * @prop {string} [key]
 * @prop {string|number|boolean} [value]
 */
module.exports = async function(args) {
  try {
    const config = await getConfig();

    // Set value for key
    if (args.key && args.value !== undefined) {
      if (config[args.key] !== undefined) {
        // Convert true/false string to Boolean
        const value =
          args.value == 'true'
            ? true
            : args.value == 'false'
              ? false
              : args.value;

        config[args.key] = value;

        await setConfig(config);
        console.log('Success');
      } else {
        console.error('Invalid key');
      }
    }
    // Return value for key
    else if (args.key) {
      if (config[args.key] !== undefined) console.log(config[args.key]);
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
