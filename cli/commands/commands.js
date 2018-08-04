const getConfig = require('lib/config/get');
const path = require('path');
const fs = require('fs-extra');

const COMMANDS = {
  convertDictionary: require('./convert/dictionary'),
  generateMediaWiki: require('./generate/mediawiki'),
  convertEmbedded: require('./convert/embedded'),
  generateCalibre: require('./generate/calibre'),
  generateLibGen: require('./generate/libgen'),
  config: require('./config')
};

module.exports = command => async ({ argv }) => {
  // Put global config into args
  const args = await getConfig();

  // Load arguments from config file
  if (argv.config) {
    // Ensure absolute path
    argv.config = path.isAbsolute(argv.config)
      ? argv.config
      : path.resolve(process.cwd(), argv.config);

    Object.assign(args, await fs.readJSON(argv.config));
  }
  // Parse JSON string
  if (argv.jsonconfig) {
    Object.assign(args, JSON.parse(argv.jsonconfig));
  }

  COMMANDS[command](Object.assign(args, argv));
};
