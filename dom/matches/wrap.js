/**
 * @typedef {object} WrapInfo
 * @prop {number[]} inserts - The indexes within the modified `html` where
 * matches were wrapped.
 * @prop {number} wrapLength - The combined length of the strings that wrap
 * each match.
 */
/**
 * Wraps strings within a book's HTML content with a `span` element with
 * `class` and `onclick` attributes.
 * @param {NodeMatch[]} matches - From `findMatchingNodes()`
 * @param {string} type - The type of item. Also used for class name.
 * @param {string} key - Used in onclick to determine which item is clicked.
 * @return {WrapInfo}
 */
export default function(matches, type, key) {

  const wrap = [
    `<span ` +
      `class="${type}" ` +
      `onclick="!event.stopPropagation() && parent.postMessage(` +
        `{type: '${type}', key: '${key}', epubjs: true}, '*'` +
      `)"` +
    `>`,
    `</span>`
  ],
  wrapLength = wrap[0].length + wrap[1].length,
  inserts = [];

  // Offset required since we're manipulating the HTML and therefore
  // changing the length / indexes
  let offset = 0;

  matches.forEach(match => {
    /** @type {number} */
    const start = match.start + offset;
    /** @type {number} */
    const end = match.end + offset;
     /** @type {string} */
     let html = match.node.innerHTML;

    html =
      html.substring(0, start) +
        wrap[0] +
          html.substring(start, end) +
        wrap[1] +
      html.substring(end);

    offset += wrapLength;
    inserts.push(end);
    match.node.innerHTML = html;
  });

  return { wrapLength, inserts };

}