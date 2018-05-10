const { DOMParser } = require('xmldom');
const getConfig = require('lib/config/get');
const { spawn } = require('child_process');
const constants = require('../../constants');
const puppeteer = require('puppeteer');
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

    const browser = await puppeteer.launch();
    const puppet = await browser.newPage();

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

      // Free up some memory eventually
      delete page[i];

      // Load page in puppeteer
      await puppet.goto(`${url}/wiki/${title.replace(/ /g, '_')}`);
      const dom = await puppet.$('#WikiaMainContent');

      await puppet.evaluate(url => {
        const aside = document.querySelector('aside');
        aside && aside.remove();

        for (let e of Array.from(document.querySelectorAll('.editsection'))) {
          e.remove();
        }

        for (let a of Array.from(document.getElementsByTagName('a'))) {
          const href = a.getAttribute('href');

          // Absolute url to Wikia page
          if (!/^https?:\/\//.test(href)) a.setAttribute('href', url + href);
        }

        for (let e of document.querySelectorAll('*')) {
          // Remove all non-href/src attributes
          Array.from(e.attributes).forEach(
            attr =>
              attr.name != 'href' &&
              attr.name != 'src' &&
              e.removeAttribute(attr.name)
          );
        }
      }, url);

      // Convert HTML to Markdown via Pandoc
      try {
        text = await new Promise(async (resolve, reject) => {
          const pandoc = spawn('pandoc', ['-f', 'html', '-t', 'markdown']);
          let markdown = '';

          // Build HTML to Markdown output until finished, then resolve
          pandoc.stdout.on('data', data => (markdown += data.toString()));
          pandoc.stderr.on('data', data => reject);
          pandoc.on('close', code => (code == 0 ? resolve(markdown) : null));

          pandoc.stdin.write(await puppet.evaluate(e => e.innerHTML, dom));
          pandoc.stdin.end();
        });
        text = text.replace(/<\/?\w+>/g, '');
      } catch (err) {
        pageErrors++;
        continue;
      }

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

    await browser.close();

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
