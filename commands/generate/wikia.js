const { DOMParser } = require('xmldom');
const getConfig = require('lib/config/get');
const { spawn } = require('child_process');
const constants = require('../../constants');
const readFile = require('lib/files/read');
const request = require('superagent');
const fs = require('fs-extra');

/**
 * @typedef {object} GenerateWikiaArguments
 * @prop {string} dump - An absolute path to the XML dump file
 * @prop {number} set - Id of an annotation set the user is a moderator of
 * @prop {string} url - The base url for the wiki: `http://name.wikia.com`
 */
/**
 * Add, remove, and update items within an annotation set using data from a
 *  Wikia.com dump.
 * @param {object} yargs
 * @param {GenerateWikiaArguments} yargs.argv
 */
module.exports = async function(yargs) {
  const { dump, set: setId, url } = yargs.argv;

  try {
    const config = await getConfig();

    // Download annotation set
    console.log('Downloading set');
    let res = await request
      .get(`${constants.XYANNOTATIONS}sets/${setId}/download`)
      .query({ subscriptionKey: config.xyfirAnnotationsSubscriptionKey });
    const { set } = res.body;

    // Load all <page> elements
    console.log('Loading pages');
    const pages = Array.from(
      new DOMParser()
        .parseFromString(await readFile(dump))
        .getElementsByTagName('mediawiki')[0]
        .getElementsByTagName('page')
    );
    console.log(`Loaded ${pages.length} pages`);

    let nextStats = Date.now() + 20 * 1000,
      pageErrors = 0,
      itemErrors = 0,
      deleted = 0,
      created = 0,
      updated = 0;
    const logStats = /** @param {number} page */ page => {
      if (Date.now() < nextStats) return;

      console.log(`${page} / ${pages.length} pages (${page / pages.length}%)`);
      console.log(`Created ${created} items`);
      console.log(`Deleted ${deleted} items`);
      console.log(`Updated ${updated} items`);
      console.log(`${pageErrors} page errors`);
      console.log(`${itemErrors} item errors`);
      console.log('\n\n=====');

      nextStats = Date.now() + 20 * 1000;
    };

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      // Ignore all pages with a namespace
      if (page.getElementsByTagName('ns')[0].textContent != '0') continue;

      logStats(i + 1);

      const title = page.getElementsByTagName('title')[0].textContent;
      let text = '';

      // Convert MediaWiki to HTML to Markdown via Pandoc
      try {
        text = await new Promise((resolve, reject) => {
          const toHTML = spawn('pandoc', ['-f', 'mediawiki', '-t', 'html']);
          const toMD = spawn('pandoc', ['-f', 'html', '-t', 'markdown']);
          let html = '',
            markdown = '';

          // Take MediaWiki to HTML output and pass to HTML to Markdown
          toHTML.stdout.on('data', data => (html += data.toString()));
          toHTML.stderr.on('data', reject);
          toHTML.on('close', async code => {
            if (code != 0) return;

            // Parse via xmldom
            const dom = new DOMParser().parseFromString(html);

            // Fix links
            for (let a of Array.from(dom.getElementsByTagName('a'))) {
              const href = a.getAttribute('href');

              // Absolute url to Wikia page
              if (!/^https?:\/\//.test(href))
                a.setAttribute('href', `${url}/wiki/${href}`);

              // Remove all non-href elements
              Array.from(a.attributes).forEach(
                attr => attr.name != 'href' && a.removeAttribute(attr.name)
              );
            }

            // Fix images
            for (let img of Array.from(dom.getElementsByTagName('img'))) {
              let src = img.getAttribute('src');

              try {
                // Get the actual file link
                res = await request.get(
                  `http://lotr.wikia.com/wiki/File:${src}`
                );
                src = new DOMParser()
                  .parseFromString(res.text)
                  .getElementById('file')
                  .getElementsByTagName('a')[0]
                  .getAttribute('href');
                img.setAttribute('src', src);

                // Remove all non-src elements
                Array.from(img.attributes).forEach(
                  attr => attr.name != 'src' && img.removeAttribute(attr.name)
                );
              } catch (err) {
                console.error(err);
                img.parentNode.removeChild(img);
              }
            }

            toMD.stdin.write(dom.toString());
            toMD.stdin.end();
          });

          // Build HTML to Markdown output until finished, then resolve
          toMD.stdout.on('data', data => (markdown += data.toString()));
          toMD.stderr.on('data', data => reject);
          toMD.on('close', code => (code == 0 ? resolve(markdown) : null));

          // Load MediaWiki text content into converter
          toHTML.stdin.write(
            page
              .getElementsByTagName('revision')[0]
              .getElementsByTagName('text')[0].textContent
          );
          toHTML.stdin.end();
        });
      } catch (err) {
        pageErrors++;
        continue;
      }

      // Free up some memory eventually
      delete page[i];

      const item = {
        title,
        searches: [title],
        annotations: [
          {
            type: 1,
            name: 'Wikia',
            value: text
          }
        ]
      };

      // Create or update items
      try {
        // Find item in set that matches item generated from dump
        const ogItem = set.items.find(i => i.title == item.title);

        // Create new item if it has no match in `set.items`
        if (ogItem === undefined) {
          await request
            .post(`${constants.XYANNOTATIONS}sets/${setId}/items`)
            .query({ accessKey: config.xyfirAnnotationsAccessKey })
            .send({ ...item });
          created++;
        }
        // Update item in set with new item from dump
        else if (JSON.stringify(ogItem) != JSON.stringify(item)) {
          await request
            .put(`${constants.XYANNOTATIONS}sets/${setId}/items/${ogItem.id}`)
            .query({ accessKey: config.xyfirAnnotationsAccessKey })
            .send({ ...item });
          updated++;

          // Any items remaining in `set.items` after all pages are parsed will
          // be deleted from the set
          set.items = set.items.filter(i => i.id != ogItem.id);
        }
      } catch (err) {
        return console.log(err);
        itemErrors++;
      }
    }

    // Delete items in set that don't exist in dump
    try {
      for (let item of set.items) {
        await request
          .delete(`${constants.XYANNOTATIONS}sets/${setId}/items/${item.id}`)
          .query({ accessKey: config.xyfirAnnotationsAccessKey });
        deleted++;
      }
    } catch (err) {
      itemErrors++;
    }

    logStats(pages.length);
  } catch (e) {
    console.error(e.toString().red);
    console.error(e);
  }
};
