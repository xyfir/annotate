export const INSERT_MODES = Object.freeze({
  WRAP: {
    LINK: 0,
    ONCLICK: 1
  },
  REFERENCE: {
    LINK: 10,
    ONCLICK: 11
  }
});

/**
 * @typedef {object} InsertOptions
 * @prop {MatchIndex[]} matches
 * @prop {string} html - The HTML book content to manipulate.
 * @prop {string} [type=annotation] - The type of highlight. Also used for
 *  class name. This can be ignored, and is mainly used for non-annotation
 *  purposes in xyBooks.
 * @prop {string|number} key - Used in `action` to determine which item is
 *  clicked.
 * @prop {number} mode - See the `INSERT_MODES` export.
 * @prop {function} action - This is a template function that takes two
 *  parameters, `type` and `key`, and returns a `string` that will be used for
 *  the `onclick` or `href` attributes of the inserted element based on `mode`.
 */
/**
 * @typedef {object} InsertInfo
 * @prop {string} html - The modified HTML string.
 * @prop {number[]} inserts - The indexes within the modified `html` where
 * matches were wrapped.
 * @prop {number} wrapLength - The combined length of the strings that wrap
 * each match. Certain modes have an empty string for the left side.
 */
/**
 * Insert annotation elements for matches within a book's HTML content.
 * @param {InsertOptions} opt
 * @return {InsertInfo}
 */
export function insert(opt) {
  const { action, mode, matches, type = 'annotation', key } = opt;
  let { html } = opt;

  const wrap = (() => {
    switch (mode) {
      case INSERT_MODES.WRAP.LINK:
        return [`<a class="xy-${type}" href="${action(type, key)}">`, `</a>`];
      case INSERT_MODES.WRAP.ONCLICK:
        return [
          `<span class="xy-${type}" onclick="${action(type, key)}">`,
          `</span>`
        ];
      case INSERT_MODES.REFERENCE.LINK:
        return [
          ``,
          `<a class="xy-${type}" href="${action(type, key)}"><sup>xy</sup></a>`
        ];
      case INSERT_MODES.REFERENCE.ONCLICK:
        return [
          ``,
          `<span class="xy-${type}" onclick="${action(
            type,
            key
          )}"><sup>xy</sup></span>`
        ];
      default:
        throw 'Invalid `mode`';
    }
  })();

  const wrapLength = wrap[0].length + wrap[1].length;
  const inserts = [];

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
