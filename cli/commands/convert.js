const getConfig = require('lib/config/get');
const writeFile = require('lib/files/write');
const constants = require('../constants');
const { exec } = require('child_process');
const request = require('superagent');
const marked = require('marked');
const path = require('path');
const fs = require('fs-extra');

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

    // Build OPF
    await writeFile(
      path.resolve(basePath, 'dict.opf'),
      `
      <?xml version="1.0" encoding="utf-8"?>
      <package unique-identifier="uid">
        <metadata>
          <dc-metadata xmlns:dc="http://purl.org/metadata/dublin_core" xmlns:oebpackage="http://openebook.org/namespaces/oeb-package/1.0/">
            <dc:Title>Dictionary from xyAnnotations Set #${set.id}</dc:Title>
            <dc:Language>${'en'}</dc:Language>
            <dc:Creator>xyAnnotations & others</dc:Creator>
            <dc:Description>
              A dictionary created from the xyAnnotations annotation set #${
                set.id
              }.
            </dc:Description>
            <dc:Date>${new Date().toISOString()}</dc:Date>
          </dc-metadata>
          <x-metadata>
            <output encoding="utf-8" content-type="text/x-oeb1-document"></output>
            <EmbeddedCover>${'dict.png'}</EmbeddedCover>
            <DictionaryInLanguage>${'en'}</DictionaryInLanguage>
            <DictionaryOutLanguage>${'en'}</DictionaryOutLanguage>
          </x-metadata>
        </metadata>
        <manifest>
          <item id="item1" media-type="text/x-oeb1-document" href="dict.html"></item>
        </manifest>
        <spine toc="toc">
          <itemref idref="item1"/>
        </spine>
        <guide>
          <reference type="toc" title="Table of Contents" href="dict.html#toc"></reference>
        </guide>
      </package>
      `
    );

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

    // Build HTML
    await writeFile(
      path.resolve(basePath, 'dict.html'),
      `
      <!DOCTYPE html>
      <html lang="${'en'}">
      <head>
        <meta charset="UTF-8">
        <title>Dictionary from xyAnnotations Set #${set.id}</title>
      </head>
      <body>
        <a name="toc"></a>
        <mbp:pagebreak />

        ${set.items
          .map(
            item =>
              `<idx:entry>
                <idx:orth>
                  ${item.searches[0]}
                  <idx:infl>${item.searches
                    .slice(1)
                    .map(s => `<idx:iform value="${s}"/>`)
                    .join('\n')}</idx:infl>
                </idx:orth>

                ${item.annotations
                  .map(
                    (a, i) =>
                      `<h1>Entry #${i + 1}: ${a.name}</h1>\n\n` +
                      marked(a.value, { sanitize: true })
                  )
                  .join('\n\n<hr /><hr /><hr />')}
              </idx:entry>`
          )
          .join('\n\n')}
      </body>
      </html>
      `
    );

    // Build MOBI
    try {
      console.log(
        await new Promise((resolve, reject) =>
          exec(
            `kindlegen ${path.resolve(basePath, 'dict.opf')}`,
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

    // Delete source files
    await fs.remove(path.resolve(basePath, 'dict.opf'));
    await fs.remove(path.resolve(basePath, 'dict.html'));
  } catch (e) {
    console.error(e);
  }
};
