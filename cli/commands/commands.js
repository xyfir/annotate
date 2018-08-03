const path = require('path');
const fs = require('fs-extra');

const COMMANDS = {
  removeFromIgnoreList: require('./ignore-list/remove-from'),
  convertToDictionary: require('./convert/dictionary'),
  generateMediaWiki: require('./generate/mediawiki'),
  addToIgnoreList: require('./ignore-list/add-to'),
  resetIgnoreList: require('./ignore-list/reset'),
  generateCalibre: require('./generate/calibre'),
  showIgnoreList: require('./ignore-list/show'),
  generateLibGen: require('./generate/libgen'),
  config: require('./config'),
  insert: require('./insert')
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
