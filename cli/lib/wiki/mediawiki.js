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
  // Configure HTML to Markdown converter
  const turndown = new Turndown({
    fence: '```',
    emDelimiter: '*',
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
  })
    .remove(config.ignore.htmlElements)
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
  }

  return pageErrors;
};
