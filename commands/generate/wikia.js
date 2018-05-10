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
 * @typedef {object} CommandConfig
 * @prop {number} set - Id of an annotation set the user is a moderator of
 * @prop {string} url - The base url for the wiki: `http://name.wikia.com`
 * @prop {string} dump - An absolute path to the XML dump file
 * @prop {Ignore} ignore
 * @prop {number[]} namespaces - A whitelist of namespaces
 */
/**
 * @typedef {object} Ignore
 * @prop {string[]} titles
 * @prop {string[]} sections
 */
/**
 * @typedef {object} GenerateWikiaArguments
 * @prop {string} config - An absolute path to a config file containing the
 *  actual arguments for the command.
 */
/**
 * Add, remove, and update items within an annotation set using data from a
 *  Wikia.com dump.
 * @param {object} yargs
 * @param {GenerateWikiaArguments} yargs.argv
 */
module.exports = async function(yargs) {
  try {
    /** @type {CommandConfig} */
    const config = JSON.parse(await readFile(yargs.argv.config));

    const {
      xyfirAnnotationsSubscriptionKey,
      xyfirAnnotationsAccessKey
    } = await getConfig();

    // Download annotation set
    console.log('Downloading set');
    let res = await request
      .get(`${constants.XYANNOTATIONS}sets/${config.set}/download`)
      .query({ subscriptionKey: xyfirAnnotationsSubscriptionKey });
    const { set } = res.body;

    // Load all <page> elements
    console.log('Loading pages');
    const pages = Array.from(
      new DOMParser()
        .parseFromString(await readFile(config.dump))
        .getElementsByTagName('mediawiki')[0]
        .getElementsByTagName('page')
    )
      // Get pages in provided namespace(s)
      .filter(
        p =>
          config.namespaces.indexOf(
            +p.getElementsByTagName('ns')[0].textContent
          ) > -1
      )
      // Convert pages to array of titles and ids
      .map(p => ({
        title: p.getElementsByTagName('title')[0].textContent,
        id: +p.getElementsByTagName('id')[0].textContent
      }))
      // Ignore by title
      .filter(p => {
        for (let t of config.ignore.titles) {
          // Regex
          if (t.startsWith('/') && t.endsWith('/')) {
            if (new RegExp(t.substr(1, t.length - 2)).test(p.title))
              return false;
          }
          // Contains
          else if (p.title.indexOf(t) > -1) return false;
        }

        return true;
      });
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
      try {
        res = await request
          .get(`${config.url}/api/v1/Articles/AsSimpleJson`)
          .query({ id: page.id });
      } catch (err) {
        pageErrors++;
        continue;
      }
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
      sectionloop: for (let section of sections) {
        // Ignore sections by their title
        for (let s of config.ignore.sections) {
          // Regex
          if (s.startsWith('/') && s.endsWith('/')) {
            if (new RegExp(s.substr(1, s.length - 2)).test(section.title))
              continue sectionloop;
          }
          // Contains
          else if (section.title.indexOf(s) > -1) continue sectionloop;
        }

        // Build # Heading
        text += `${'#'.repeat(section.level)} ${section.title}\n\n`;

        // Build images
        for (let img of section.images) {
          text += `![${img.caption}](${img.src})\n\n`;
        }

        // Build paragraphs or lists
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
            .post(`${constants.XYANNOTATIONS}sets/${config.set}/items`)
            .query({ accessKey: xyfirAnnotationsAccessKey })
            .send({ ...item });
          created++;
        }
        // Update item in set with new item from dump
        else if (JSON.stringify(ogItem) != JSON.stringify(item)) {
          await request
            .put(
              `${constants.XYANNOTATIONS}sets/${config.set}/items/${ogItem.id}`
            )
            .query({ accessKey: xyfirAnnotationsAccessKey })
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
          .delete(
            `${constants.XYANNOTATIONS}sets/${config.set}/items/${item.id}`
          )
          .query({ accessKey: xyfirAnnotationsAccessKey });
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
