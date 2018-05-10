const { DOMParser } = require('xmldom');
const getConfig = require('lib/config/get');
const { spawn } = require('child_process');
const constants = require('../../constants');
const readFile = require('lib/files/read');
const request = require('superagent');
const fs = require('fs-extra');

/**
 * @param {object[]} elements
 * @param {number} level
 * @return {string}
 */
const LIST = (elements, level) =>
  elements
    .map(
      element =>
        `${'  '.repeat(level)}- ${element.text}\n` +
        LIST(element.elements, level + 1)
    )
    .join('');

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
    )
      // Ignore all pages with a namespace
      .filter(p => p.getElementsByTagName('ns')[0].textContent == '0')
      // Convert pages to array of titles and ids
      .map(p => ({
        title: p.getElementsByTagName('title')[0].textContent,
        id: +p.getElementsByTagName('id')[0].textContent
      }));
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
      logStats(i + 1);

      // Load simple JSON for page
      res = await request
        .get(`${url}/api/v1/Articles/AsSimpleJson`)
        .query({ id: page.id });
      const { sections } = res.body;

      // Page redirects to another
      if (
        sections.length == 1 &&
        sections[0].content.length == 1 &&
        sections[0].content[0].type == 'list' &&
        sections[0].content[0].elements.length == 1 &&
        sections[0].content[0].elements[0].text.startsWith('REDIRECT: ')
      )
        continue;

      let text = '';
      for (let section of sections) {
        text += `${'#'.repeat(section.level)} ${section.title}\n\n`;

        for (let img of section.images) {
          text += `![${img.caption}](${img.src})\n\n`;
        }

        for (let content of section.content) {
          switch (content.type) {
            case 'paragraph':
              text += `${content.text}\n\n`;
              break;
            case 'list':
              text += LIST(content.elements, 0);
              text += '\n';
          }
        }
      }

      const item = {
        title: page.title,
        searches: [page.title],
        annotations: [
          {
            type: 1,
            name: 'Wikia',
            value: text
          }
        ]
      };
      delete page[i];

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
