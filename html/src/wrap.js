/**
 * @typedef {object} WrapOptions
 * @prop {MatchIndex[]} matches
 * @prop {string} html - The HTML book content to manipulate.
 * @prop {string} type - The type of item. Also used for class name.
 * @prop {string|number} key - Used in onclick to determine which item is
 *  clicked.
 * @prop {function} onclick - This is a TEMPLATE function that takes two
 *  parameters, `type` and `key`, and returns a string that will be used for
 *  the highlight elements' `onclick` attribute.
 */
/**
 * @typedef {object} WrapInfo
 * @prop {string} html - The modified HTML string.
 * @prop {number[]} inserts - The indexes within the modified `html` where
 * matches were wrapped.
 * @prop {number} wrapLength - The combined length of the strings that wrap
 * each match.
 */
/**
 * Wraps strings within a book's HTML content with a `span` element with
 * `class` and `onclick` attributes.
 * @param {WrapOptions} opt
 * @return {WrapInfo}
 */
export default function(opt) {

  const {onclick, matches, type, key} = opt;
  let {html} = opt;

  const wrap = [
    `<span class="${type}" onclick="${onclick(type, key)}">`,
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

    html =
      html.substring(0, start) +
        wrap[0] +
          html.substring(start, end) +
        wrap[1] +
      html.substring(end);

    offset += wrapLength;
    inserts.push(end);
  });

  return { html, wrapLength, inserts };

}