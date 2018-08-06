import buildSearchOrder from './build-search-order';
import findMatchIndexes from './find-indexes';
import escapeRegex from 'escape-string-regexp';
import { insert } from './insert';

/**
 * @type {object} BuildHTMLStringOptions
 * @prop {string} html - The HTML string to insert annotations into.
 * @prop {AnnotationMarkers} markers - An annotation set
 * @prop {number} chapter - Index of the chapter in the book.
 * @prop {AnnotationSet} set - An annotation set
 * @prop {number} mode - See the `INSERT_MODES` export.
 * @prop {function} action - This is a template function that takes two
 *  parameters, `key` and `type`, and returns a `string` that will be used for
 *  the `onclick` or `href` attributes of the inserted element based on `mode`.
 */
/**
 * @typedef {object} AnnotationSet
 * @prop {number} id
 * @prop {object[]} items
 */
/**
 * Finds and highlights an annotation set's items within the ebook's rendered
 * HTML.
 * @param {BuildHTMLStringOptions} opt
 * @return {string} The modified HTML.
 */
export default function(opt) {
  const { chapter, markers, set, action, mode } = opt;
  let { html } = opt;

  // Create a flat, sorted array of all searches in all items
  const searchOrder = buildSearchOrder(set.items);

  const wordChar = /[A-Za-z0-9]/;
  searchOrder.forEach(o => {
    const item = set.items[o.item];
    const search = item.searches[o.search];
    const isObj = typeof search == 'object';

    /** @type {RegExp} */
    let needle;
    if (isObj && search.regex) {
      needle = new RegExp(search.main, 'g');
    } else {
      const main = isObj ? search.main : search;

      // If not regex, escape regex characters and wrap in \b
      // Add \b to start/end of regex if start/end is a non-word character
      // Prevents words from being highlighted within longer words
      needle = new RegExp(
        (wordChar.test(main[0]) ? '\\b' : '') +
          escapeRegex(main) +
          (wordChar.test(main[main.length - 1]) ? '\\b' : ''),
        'g'
      );
    }

    // Get start/end string indexes for each match
    let matches = findMatchIndexes(needle, html);

    if (isObj && (search.before || search.after)) {
      // Filter out invalid matches based on before|after
      matches = matches.filter(match => {
        // Get before/after marker objects
        // Each object contains chapter index and string index
        // of where marker occured in book
        const before = markers[`${item.id}-${o.search}-1`];
        const after = markers[`${item.id}-${o.search}-2`];

        // In book's content, where a search has before/after
        // :before: ... :main: ... :after:

        if (search.before) {
          // Marker could not be found
          if (before === undefined) return false;
          // User has yet to reach chapter where marker occurs
          else if (before.chapter > chapter) return false;
          // Match has yet to reach index in chapter where marker occurs
          else if (before.chapter == chapter && before.start > match.start)
            return false;
        }

        if (search.after) {
          // Marker could not be found
          if (after === undefined) return false;
          // User has passed chapter where marker occurs
          else if (after.chapter < chapter) return false;
          // Match has passed index within chapter where marker occurs
          else if (after.chapter == chapter && after.end < match.end)
            return false;
        }

        return true;
      });
    }

    const inserted = insert({
      key: `${set.id}-${item.id}`,
      html,
      mode,
      action,
      matches
    });

    html = inserted.html;

    // Update string indexes for current chapter's markers
    Object.keys(markers)
      .filter(marker => marker.chapter == chapter)
      .map(marker =>
        // Increase marker's string index by the wrapper's length every time
        // an annotation was inserted before the marker
        inserted.inserts.map(index => {
          if (markers[marker].end > index) {
            markers[marker].end += inserted.wrapLength;
            markers[marker].start += inserted.wrapLength;
          }
        })
      );
  });

  return html;
}
