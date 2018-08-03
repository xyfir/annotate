const path = require('path');
const fs = require('fs-extra');

const COMMANDS = {
  convertToDictionary: require('./convert/dictionary'),
  generateMediaWiki: require('./generate/mediawiki'),
  generateCalibre: require('./generate/calibre'),
  generateLibGen: require('./generate/libgen'),
  insertFile: require('./insert/file'),
  config: require('./config')
};

module.exports = command => async ({ argv }) => {
  const args = {};

  // Load arguments from config file
  if (argv.config) {
    const config = await fs.readJSON(
      path.isAbsolute(argv.config)
        ? argv.config
        : path.resolve(process.cwd(), argv.config)
    );
    Object.assign(args, config);
  }
  // Parse JSON string
  if (argv.jsonconfig) {
    Object.assign(args, JSON.parse(argv.jsonconfig));
  }

  COMMANDS[command](Object.assign(args, argv));
};
