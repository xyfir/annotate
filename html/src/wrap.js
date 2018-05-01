/**
 * @typedef {object} WrapOptions
 * @prop {MatchIndex[]} matches
 * @prop {string} html - The HTML book content to manipulate.
 * @prop {string} [type=annotation] - The type of highlight. Also used for
 *  class name. This can be ignored, and is mainly used for other purposes
 *  in xyBooks.
 * @prop {string|number} key - Used in `action` to determine which item is
 *  clicked.
 * @prop {string} mode - `'normal|link'` - When `normal`, the matches are
 *  wrapped in a `span` element with an `onclick` attribute. When `link`, the
 *  matches are wrapped in a `<a>` element with an `href` attribute.
 * @prop {function} action - This is a template function that takes two
 *  parameters, `type` and `key`, and returns a string that will be used for
 *  the `onclick` attribute if `mode == 'normal'` and the `href` attribute if
 *  `mode == 'link'`.
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
 * Wraps mathes within a book's HTML content.
 * @param {WrapOptions} opt
 * @return {WrapInfo}
 */
export default function(opt) {
  const { action, mode, matches, type = 'annotation', key } = opt;
  let { html } = opt;

  const wrap =
      mode == 'normal'
        ? [`<span class="${type}" onclick="${action(type, key)}">`, `</span>`]
        : [`<a class="${type}" href="${action(type, key)}">`, `</a>`],
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
