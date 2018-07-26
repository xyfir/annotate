const {
  TOC_HTML,
  DICT_OPF,
  DEFS_HTML,
  TITLE_HTML
} = require('lib/convert/dictionary-templates');
const getConfig = require('lib/config/get');
const writeFile = require('lib/files/write');
const constants = require('../constants');
const { exec } = require('child_process');
const request = require('superagent');
const path = require('path');
const fs = require('fs-extra');

// Useful resources:
// https://gist.github.com/myfreeweb/1731622
// https://www.mobileread.com/forums/showthread.php?t=256570
// http://www.fantasycastlebooks.com/resources/AmazonKindlePublishingGuidelines2014.1.pdf

/**
 * @typedef {object} ConvertArguments
 * @prop {string} source
 * @prop {string} from
 * @prop {string} to
 */
/**
 * Convert content from one format to another.
 * @param {object} yargs
 * @param {ConvertArguments} yargs.argv
 */
module.exports = async function(yargs) {
  const { from, to } = yargs.argv;
  let { source } = yargs.argv;

  try {
    if (from != 'xyannotations' || to != 'kindle_dictionary')
      throw 'Invalid conversion, see docs';

    const config = await getConfig();
    let basePath = '';
    let set;

    // Download annotation set
    if (typeof source == 'number') {
      const res = await request
        .get(`${constants.XYANNOTATIONS}sets/${source}/download`)
        .query({ minify: true })
        .auth('subscription', config.xyfirAnnotationsSubscriptionKey);
      basePath = process.cwd();
      set = res.body.set;
    }
    // Load annotation set from file
    else {
      source = path.isAbsolute(source)
        ? source
        : path.resolve(process.cwd(), source);
      basePath = source
        .slice(path.sep)
        .slice(0, -1)
        .join(path.sep);
      set = await fs.readJSON(source);
    }

    set.items = set.items
      // Remove non-Document annotations
      // Remove regex, specific, and '"'-containing searches
      .map(i => {
        i.annotations = i.annotations.filter(a => a.type == 1);
        i.searches = i.searches.filter(
          s => !s.regex && !s.before && !s.after && s.indexOf('"') == -1
        );
        return i;
      })
      // Remove items
      .filter(i => i.searches.length && i.annotations.length);

    // Create source files for dictionary
    await writeFile(path.resolve(basePath, 'dict.opf'), DICT_OPF(set));
    await writeFile(path.resolve(basePath, 'defs.html'), DEFS_HTML(set));
    await writeFile(path.resolve(basePath, 'title.html'), TITLE_HTML(set));
    await writeFile(path.resolve(basePath, 'toc.html'), TOC_HTML(set));

    // Build MOBI
    try {
      console.log(
        await new Promise((resolve, reject) =>
          exec(
            `kindlegen ${path.resolve(
              basePath,
              'dict.opf'
            )} -c2 -verbose -dont_append_source`,
            (err, stdout, stderr) => {
              if (err) reject(err);
              else if (stderr) reject(stderr);
              else resolve(stdout);
            }
          )
        )
      );
    } catch (err) {
      console.warn('KindleGen errored, but may have still worked');
      console.warn(err);
    }

    // Delete temp files
    await fs.remove(path.resolve(basePath, 'toc.html'));
    await fs.remove(path.resolve(basePath, 'dict.opf'));
    await fs.remove(path.resolve(basePath, 'defs.html'));
    await fs.remove(path.resolve(basePath, 'title.html'));
  } catch (e) {
    console.error(e);
  }
};
