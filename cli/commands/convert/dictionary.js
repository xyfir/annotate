const {
  TOC_HTML,
  DICT_OPF,
  DEFS_HTML,
  TITLE_HTML
} = require('lib/convert/dictionary/templates');
const downloadSet = require('lib/xyannotations/download-set');
const writeFile = require('lib/files/write');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// Useful resources:
// https://gist.github.com/myfreeweb/1731622
// https://www.mobileread.com/forums/showthread.php?t=256570
// http://www.fantasycastlebooks.com/resources/AmazonKindlePublishingGuidelines2014.1.pdf
// https://github.com/wjdp/gotdict

/**
 * @typedef {object} Arguments
 * @prop {number} [compress] - Compress the dictionary file.
 *  `0` = none
 *  `1` = standard DOC compression
 *  `2` = Kindle huffdic compression
 * @prop {string} [output] - File path+name for dictionary file.
 * @prop {string} [file]
 * @prop {number} [id]
 */
/**
 * Convert annotation set to dictionary.
 * @param {object} yargs
 * @param {Arguments} yargs.argv
 */
module.exports = async function(yargs) {
  const { id, compress } = yargs.argv;
  let { file, output } = yargs.argv;

  try {
    let basePath = '';
    let set;

    // Download annotation set
    if (id) {
      basePath = process.cwd();
      set = await downloadSet(id, true);
    }
    // Load annotation set from file
    else {
      file = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
      basePath = file
        .slice(path.sep)
        .slice(0, -1)
        .join(path.sep);
      set = await fs.readJSON(file);
    }

    basePath = path.resolve(basePath, `temp-${Date.now()}`);
    await fs.mkdir(basePath);

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

    // Build list of letters for letter-specific definition files
    /** @type {string[]} */
    let letters = [];
    for (let item of set.items) {
      /** @type {string} */
      const letter = item.searches[0][0].toLowerCase();
      const code = letter.charCodeAt(0);

      // Not an A-Z letter
      if (code < 97 || code > 122) {
        if (letters.indexOf('misc') == -1) letters.push('misc');
      }
      // A-Z
      else if (letters.indexOf(letter) == -1) letters.push(letter);
    }
    letters = letters.sort();

    // Write letter-specific definition files
    for (let letter of letters) {
      await writeFile(
        path.resolve(basePath, `defs-${letter}.html`),
        DEFS_HTML(set, letter)
      );
    }

    // Create source files for dictionary
    await writeFile(path.resolve(basePath, 'title.html'), TITLE_HTML(set));
    await writeFile(path.resolve(basePath, 'dict.opf'), DICT_OPF(set, letters));
    await writeFile(path.resolve(basePath, 'toc.html'), TOC_HTML(set, letters));

    // Build MOBI
    await new Promise(resolve => {
      const kg = spawn('kindlegen', [
        path.resolve(basePath, 'dict.opf'),
        `-c${+compress || 0}`,
        '-verbose',
        '-dont_append_source'
      ]);

      kg.stderr.on('data', d => console.error(`[e][kindlegen]`, d.toString()));
      kg.stdout.on('data', d => console.log(`[i][kindlegen]`, d.toString()));
      kg.on('close', code => {
        if (code == 0) {
          console.log('KindleGen completed without error');
          resolve();
        } else {
          console.warn('KindleGen errored or completed with warnings');
          resolve();
        }
      });
    });

    output = output || path.resolve(basePath, '../', `dict-${Date.now()}.mobi`);

    // Copy .mobi file out of temp
    await fs.copy(path.resolve(basePath, 'dict.mobi'), output);

    // Delete temp files
    await fs.remove(basePath);
  } catch (e) {
    console.error(e);
  }
};
