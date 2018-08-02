const request = require('superagent');

/**
 * @param {object[]} elements
 * @param {number} level
 * @return {string}
 */
const LIST = (elements, level) =>
  elements
    // For some reason, occasionally `null` elements are returned...
    .filter(e => e)
    .map(
      element =>
        `${'  '.repeat(level)}- ${element.text}\n` +
        LIST(element.elements, level + 1)
    )
    .join('');

/**
 * Build xyAnnotations annotation set item from a Wikia page.
 * @async
 * @param {CommandConfig} config
 * @param {Distinction[]} distinctions
 * @param {AnnotationSetItem} item
 * @return {number} The amount of errors encountered trying to load the pages.
 */
module.exports = async function(config, distinctions, item) {
  let pageErrors = 0;
  let res;

  // Download contents of pages and build annotations
  for (let p of distinctions) {
    // Load simple JSON for page
    try {
      res = await request
        .get(`${config.url}/api/v1/Articles/AsSimpleJson`)
        .query({ id: p.id });
    } catch (err) {
      console.error(err, p);
      pageErrors++;
      continue;
    }
    const { sections } = res.body;

    let text = '';
    sectionloop: for (let section of sections) {
      // Ignore sections by their title
      for (let s of config.ignore.sections) {
        if (new RegExp(s).test(section.title)) continue sectionloop;
      }

      // Build # Heading
      text += `${'#'.repeat(section.level)} ${section.title}\n\n`;

      // Build images
      for (let img of section.images) {
        // Get original size, plus cut off optional text to save space
        if (img.src.indexOf('/revision/latest') > -1)
          img.src = img.src.substr(0, img.src.indexOf('/revision/latest'));
        text += `![${img.caption || ''}](${img.src})\n\n`;
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

    // Build annotation for page
    const annotation = {
      type: 1,
      name: p.distinction
        ? `Wikia: (${p.distinction.type}) ${p.distinction.target}`
        : `Wikia: ${p.title}`,
      value: text
    };
    item.annotations.push(annotation);
  }

  return pageErrors;
};
