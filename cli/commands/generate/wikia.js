const command = require('commands/generate/mediawiki');

/** @deprecated */
module.exports = yargs => {
  console.warn(
    (
      'This command is deprecated and will be removed. ' +
      'Use `generate mediawiki` instead.'
    ).yellow
  );
  command(yargs);
};
