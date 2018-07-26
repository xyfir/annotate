const getConfig = require('lib/config/get');
const writeFile = require('lib/files/write');
const constants = require('../constants');
const { exec } = require('child_process');
const request = require('superagent');
const marked = require('marked');
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
            <dc:Creator>xyAnnotations</dc:Creator>
            <dc:Description>
              A dictionary created from the xyAnnotations annotation set #${
                set.id
              }, version ${set.version}. See set for more information.
            </dc:Description>
            <dc:Date>${new Date().toISOString()}</dc:Date>
          </dc-metadata>
          <x-metadata>
            <output encoding="utf-8" content-type="text/x-oeb1-document"></output>
            <EmbeddedCover>
              ${path.resolve(
                path.dirname(require.main.filename),
                'res',
                'dictionary_cover.png'
              )}
            </EmbeddedCover>
            <DictionaryInLanguage>${'en'}</DictionaryInLanguage>
            <DictionaryOutLanguage>${'en'}</DictionaryOutLanguage>
            <DefaultLookupIndex>xy</DefaultLookupIndex>
          </x-metadata>
        </metadata>
        <manifest>
          <item id="item1" href="dict.html" media-type="application/xhtml+xml"></item>
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

    const renderer = new marked.Renderer();
    renderer.image = (href, title, text) =>
      `<a href="${href}">View Image${
        title || text ? `: ${title || text}` : ''
      }</a>`;

    // Build HTML
    await writeFile(
      path.resolve(basePath, 'dict.html'),
      `
      <!DOCTYPE html>
      <html xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:mbp="http://www.kreutzfeldt.de/mmc/mbp"
        xmlns:idx="http://www.mobipocket.com/idx"
        lang="${'en'}">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>
          Kindle Dictionary Generated from xyAnnotations Set #${set.id}
        </title>
      </head>
      <body>
      <mbp:frameset>
        ${set.items
          .map(
            i =>
              `<idx:entry id="${i.id}" name="xy" spell="yes" scriptable="yes">
                <a id="${i.id}" name="${i.id}"/>

                <div class="orth">
                <idx:orth value="${i.searches[0]}">
                  <span><b>${i.searches[0]}</b></span>

                  <idx:infl>
                    ${i.searches
                      .slice(1)
                      .map(s => `<idx:iform value="${s}"/>`)
                      .join('')}
                  </idx:infl>
                </idx:orth>
                </div>

                ${
                  i.annotations.length > 1
                    ? i.annotations
                        .map(
                          (a, index) =>
                            `<p><a href="#${i.id}-${index}">${a.name}</a></p>`
                        )
                        .join('<br/>\n') +
                      i.annotations
                        .map(
                          (a, index) =>
                            `<a name="${i.id}-${index}"/>` +
                            `<p>Entry #${index + 1}: ${a.name}</p><br/>\n\n` +
                            marked(a.value, { sanitize: true, renderer })
                        )
                        .join('\n\n<hr/><hr/><hr/>')
                    : marked(i.annotations[0].value, {
                        sanitize: true,
                        renderer
                      })
                }
              </idx:entry>`
          )
          .join('\n\n<hr/>')}
      </mbp:frameset>
      </body>
      </html>
      `
    );

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
    await fs.remove(path.resolve(basePath, 'dict.opf'));
    await fs.remove(path.resolve(basePath, 'dict.html'));
  } catch (e) {
    console.error(e);
  }
};
