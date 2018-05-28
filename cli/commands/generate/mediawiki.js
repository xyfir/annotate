const mediaWikiPagesToAnnotations = require('lib/wiki/mediawiki');
const wikiaPagesToAnnotations = require('lib/wiki/wikia');
const { DOMParser } = require('xmldom');
const getConfig = require('lib/config/get');
const { spawn } = require('child_process');
const constants = require('../../constants');
const readFile = require('lib/files/read');
const request = require('superagent');
const fs = require('fs-extra');

/**
 * @typedef {object} CommandConfig
 * @prop {number} set - Id of an annotation set the user is a moderator of
 * @prop {string} url - The base url for the wiki: `http://name.wikia.com`
 * @prop {string} dump - An absolute path to the XML dump file
 * @prop {Range} [range]
 * @prop {Ignore} ignore
 * @prop {Replace} [replace]
 * @prop {number[]} namespaces - A whitelist of namespaces
 */
/**
 * @typedef {object} Range
 * @prop {number} [start]
 * @prop {number} [end]
 */
/**
 * @typedef {object} Ignore
 * @prop {string[]} titles
 * @prop {string[]} sections
 * @prop {string[]} htmlElements
 */
/**
 * @typedef {object} Replace
 * @prop {Array.<string[]>} [html]
 * @prop {Array.<string[]>} [markdown]
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
      .auth('subscription', xyfirAnnotationsSubscriptionKey);
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
      .filter(p => {
        if (!config.namespaces || !config.namespaces.length) return true;
        const ns = p.getElementsByTagName('ns')[0];
        return ns ? config.namespaces.indexOf(+ns.textContent) > -1 : false;
      })
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

        for (let t of config.ignore.pages || config.ignore.titles) {
          if (new RegExp(t).test(p.title)) return false;
        }

        return true;
      })
      // Ignore pages outside of range
      .slice(
        config.range && config.range.start ? config.range.start : 0,
        config.range && config.range.end
      );
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
    /**
     * @param {number} page
     * @param {boolean} [force]
     */
    function logStats(page, force) {
      if (Date.now() < nextStats && !force) return;

      console.log('\n');
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
      console.log('\n');

      nextStats = Date.now() + 20 * 1000;
    }

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

      // For code-simplicity, build full, unminified item which will be
      // compared against unminified items downloaded from set
      const item = {
        title: page.distinction ? page.distinction.target : page.title,
        searches: [
          {
            main: page.distinction ? page.distinction.target : page.title,
            regex: false,
            after: '',
            before: ''
          }
        ].concat(
          // Pages that redirect to this page or any of its distinctions will
          // have their titles used as searches for this item
          pages.filter(p => titles.indexOf(p.redirect) > -1).map(p => ({
            main: p.title,
            regex: false,
            after: '',
            before: ''
          }))
        ),
        annotations: []
      };

      // Convert pages to annotations
      pageErrors += config.url.endsWith('wikia.com')
        ? await wikiaPagesToAnnotations(config, distinctions, item)
        : await mediaWikiPagesToAnnotations(config, distinctions, item);

      if (!item.annotations.filter(a => a).length) {
        console.error('Missing annotations', item);
        continue;
      }

      // General annotation post-processing not specific to any one source
      item.annotations = item.annotations.map(a => {
        // Shorten name if needed
        a.name = a.name.length > 50 ? `${a.name.substr(0, 47)}...` : a.name;

        // Find and replace Document annotation content
        if (a.type == 1 && config.replace && config.replace.markdown) {
          for (let replace of config.replace.markdown)
            a.value = a.value.replace(new RegExp(replace[0], 'g'), replace[1]);
        }

        return a;
      });

      // Create or update items
      try {
        // Find item in set that matches item generated from dump
        const ogItem = set.items.find(i => i.title == item.title);

        // Create new item if it has no match in `set.items`
        if (ogItem === undefined) {
          await request
            .post(`${constants.XYANNOTATIONS}sets/${config.set}/items`)
            .auth('access', xyfirAnnotationsAccessKey)
            .send({ ...item });
          created++;
        }
        // Item already exists in set
        else {
          // Need to take id out so it doesn't screw up the comparison
          const id = +ogItem.id;
          delete ogItem.id;

          // Update item in set with new content from dump/API
          if (JSON.stringify(ogItem) != JSON.stringify(item)) {
            await request
              .put(`${constants.XYANNOTATIONS}sets/${config.set}/items/${id}`)
              .auth('access', xyfirAnnotationsAccessKey)
              .send({ ...item });
            updated++;
          }

          // Any items remaining in `set.items` after all pages are parsed will
          // be deleted from the set since they no longer exist in Wiki
          set.items = set.items.filter(i => i.id);
        }
      } catch (err) {
        console.error(err, item);
        itemErrors++;
      }
    }

    // Delete items in set that don't exist in dump
    // Range would cause items to be deleted that shouldn't
    if (!config.range || (!config.range.start && !config.range.end)) {
      try {
        for (let item of set.items) {
          await request
            .delete(
              `${constants.XYANNOTATIONS}sets/${config.set}/items/${item.id}`
            )
            .auth('access', xyfirAnnotationsAccessKey);
          deleted++;
        }
      } catch (err) {
        console.error(err);
        itemErrors++;
      }
    }

    logStats(pages.length, true);
  } catch (e) {
    console.error(e);
  }
};
