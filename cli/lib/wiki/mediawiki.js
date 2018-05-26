const Turndown = require('turndown');
const request = require('superagent');

/**
 * Build xyAnnotations annotation set item from a MediaWiki page.
 * @async
 * @param {CommandConfig} config
 * @param {Distinction[]} distinctions
 * @param {AnnotationSetItem} item
 * @return {number} The amount of errors encountered trying to load the pages.
 */
module.exports = async function(config, distinctions, item) {
  let ignoreUntil = 0;

  // Configure HTML to Markdown converter
  const turndown = new Turndown({
    fence: '```',
    emDelimiter: '*',
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
  })
    .remove(config.ignore.htmlElements)
    .addRule('ignore', {
      filter: /** @param {Node} node */ node => {
        if (!config.ignore.sections) return false;

        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].indexOf(node.nodeName) > -1) {
          const level = +node.nodeName[1];

          // Heading is within an ignored section
          if (ignoreUntil > level) return true;

          // Determine if section should be ignored
          for (let ignore of config.ignore.sections) {
            if (new RegExp(ignore).test(node.textContent)) {
              ignoreUntil = level;
              return true;
            }
          }

          // Ignored section has been skipped
          if (ignoreUntil != 0 && ignoreUntil <= level) {
            ignoreUntil = 0;
            return false;
          }
        }
        // If element within an ignored section, return true
        else if (ignoreUntil > 0) return true;
        else return false;
      },
      replacement: () => ''
    })
    // Make link paths absolute
    .addRule('link', {
      filter: 'a',
      /**
       * @param {string} content
       * @param {HTMLAnchorElement} a
       */
      replacement: (content, a) =>
        `[${content}](${a.href.startsWith('/') ? config.url + a.href : a.href})`
    })
    // Make image paths absolute
    .addRule('image', {
      filter: 'img',
      /**
       * @param {string} content
       * @param {HTMLImageElement} img
       */
      replacement: (content, img) =>
        `![](${img.src.startsWith('/') ? config.url + img.src : img.src})`
    });

  let pageErrors = 0;
  let res;

  // Download contents of pages and build annotations
  for (let p of distinctions) {
    // Load HTML for page
    try {
      res = await request.get(`${config.url}/w/api.php`).query({
        action: 'parse',
        format: 'json',
        pageid: p.id,
        prop: 'text'
      });
    } catch (err) {
      console.error(err, p);
      pageErrors++;
      continue;
    }

    /** @type {string} */
    let html = res.body.parse.text['*'];
    res = null;

    // Find and replace HTML content
    if (config.replace && config.replace.html) {
      for (let replace of config.replace.html)
        html = html.replace(new RegExp(replace[0], 'g'), replace[1]);
    }

    // Build annotation for page
    const annotation = {
      type: 1,
      name: p.distinction
        ? `Wiki: (${p.distinction.type}) ${p.distinction.target}`
        : `Wiki: ${p.title}`,
      value: turndown.turndown(html)
    };
    annotation.name =
      annotation.name.length > 50
        ? `${annotation.name.substr(0, 47)}...`
        : annotation.name;
    item.annotations.push(annotation);

    ignoreUntil = 0;
  }

  return pageErrors;
};
