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
    /**
     * @typedef {object} Distinction
     * @prop {boolean} [main]
     * @prop {string} target
     * @prop {string} type
     */
    /**
     * @typedef {object} Page
     * @prop {Distinction} [distinction]
     * @prop {string} [redirect]
     * @prop {string} title
     * @prop {number} id
     */
    /** @type {Page[]} */
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
      // Convert pages to an array of simple objects
      .map(p => {
        // Get page title and id
        const page = {
          title: p.getElementsByTagName('title')[0].textContent,
          id: +p.getElementsByTagName('id')[0].textContent
        };

        // Determine if page redirects elsewhere
        let match;
        if (
          (match = p
            .getElementsByTagName('text')[0]
            .textContent.match(/^#redirect:?\s*\[\[(.+)(#.+)?\]\]/i))
        )
          page.redirect = match[1];

        // Determine if page is a distinction of another [(movie), (book), etc]
        if ((match = page.title.match(/(.+)\((.+)\)$/)))
          page.distinction = { target: match[1].trim(), type: match[2].trim() };

        return page;
      })
      // Ensure page has a title
      .filter(p => p.title)
      // Ignore by title
      .filter(p => {
        if (p.distinction) {
          // Pages that are both redirects *and* distinctions will not be used
          if (p.redirect) return false;

          // Remove disambiguation pages
          if (/^disamb/i.test(p.distinction.type)) return false;
        }

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

    // Ensure all distinct pages have a main page to attach to
    pages.filter(p => p.distinction).forEach(p => {
      // A main page for this distinction exists, no further processing needed
      if (
        pages.findIndex(
          _p =>
            _p.title == p.distinction.target ||
            (_p.distinction &&
              _p.distinction.target == p.distinction.target &&
              _p.distinction.main)
        ) > -1
      )
        return;

      // Turn this distinct page into a main page since pages are in order of
      // oldest to newest and hopefully the oldest distinction is the most
      // important one
      p.distinction.main = true;
    });

    let nextStats = Date.now() + 20 * 1000,
      pageErrors = 0,
      itemErrors = 0,
      deleted = 0,
      created = 0,
      updated = 0;
    const logStats = /** @param {number} page */ page => {
      if (Date.now() < nextStats) return;

      console.log(
        `${page} / ${pages.length} pages (${(
          page /
          pages.length *
          100
        ).toFixed()}%)`
      );
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

      // Skip redirects
      if (page.redirect) continue;

      // Skip non-main distinction
      if (page.distinction && !page.distinction.main) continue;

      // Load all distinctions of the current page
      const distinctions = [page].concat(
        pages.filter(
          p =>
            // Other page IS a distinction
            p.distinction &&
            // This page IS the target of that distinction
            (page.title == p.distinction.target ||
              // This page IS a (main) distinction
              (page.distinction &&
                // This page's target IS the same as the other distinction's
                page.distinction.target == p.distinction.target &&
                // That page is NOT a main distinction (that's this one)
                !p.distinction.main))
        )
      );
      // The full, original titles of all of the distinctions of the current page
      const titles = distinctions.map(p => p.title);

      const item = {
        title: page.distinction ? page.distinction.target : page.title,
        searches: [
          page.distinction ? page.distinction.target : page.title
        ].concat(
          // Pages that redirect to this page or any of its distinctions will
          // have their titles used as searches for this item
          pages.filter(p => titles.indexOf(p.redirect) > -1).map(p => p.title)
        ),
        annotations: []
      };

      // Download contents of pages and build annotations
      for (let p of distinctions) {
        // Load simple JSON for page
        try {
          res = await request
            .get(`${config.url}/api/v1/Articles/AsSimpleJson`)
            .query({ id: p.id });
        } catch (err) {
          pageErrors++;
          continue;
        }
        const { sections } = res.body;

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

        const annotation = {
          type: 1,
          name: p.distinction
            ? `Wikia: (${p.distinction.type}) ${p.distinction.target}`
            : `Wikia: ${p.title}`,
          value: text
        };
        annotation.name =
          annotation.name.length > 50
            ? `${annotation.name.substr(0, 47)}...`
            : annotation.name;
        item.annotations.push(annotation);
      }

      if (
        !item.searches.filter(s => s).length ||
        !item.annotations.filter(a => a).length
      ) {
        console.error('Missing searches/annotations', item);
        continue;
      }

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
        console.error(err, item);
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
      console.error(err);
      itemErrors++;
    }

    logStats(pages.length);
  } catch (e) {
    console.error(e);
  }
};
