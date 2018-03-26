import annotateHTML from 'repo/html';
import escapeRegex from 'escape-string-regexp';

// Modules
import findMarkers from 'annotations/find-markers';

/**
 * @typedef {object} AnnotationSet
 * @prop {number} id
 * @prop {object[]} items
 */
/**
 * Finds and highlights an annotation set's items within the ebook's rendered
 * HTML.
 * @async
 * @param {EPUBJS.Book} book - An EPUBJS `Book` instance
 * @param {AnnotationSet} set - An annotation set
 */
export default async function(book, set) {

  // Create a flat, sorted array of all searches in all items
  const searchOrder = annotateHTML.buildSearchOrder(set.items);

  // Find markers for all Before and After subsearches
  const markers = await findMarkers(book, set.items);

  const [{document}] = book.rendition.getContents();
  const wordChar = /[A-Za-z0-9]/;

  /** @type {string} */
  let html = document.body.innerHTML;

  // Get current chapter index to compare with chapter in markers
  const chapter = +book.rendition.location.start.index;

  searchOrder.forEach(o => {
    const item = set.items[o.item];
    const search = item.searches[o.search];

    /** @type {RegExp} */
    let needle;
    if (search.regex) {
      needle = new RegExp(search.main, 'g');
    }
    else {
      // If not regex, escape regex characters and wrap in \b
      // Add \b to start/end of regex if start/end is a non-word character
      // Prevents words from being highlighted within longer words
      needle = new RegExp(
        (wordChar.test(search.main[0]) ? '\\b' : '') +
        escapeRegex(search.main) +
        (wordChar.test(search.main[search.main.length - 1]) ? '\\b' : ''),
        'g'
      );
    }

    // Get start/end string indexes for each match
    let matches = annotateHTML.findMatchIndexes(needle, html);

    if (search.before || search.after) {
      // Filter out invalid matches based on before|after
      matches = matches.filter(match => {
        // Get before/after marker objects
        // Each object contains chapter index and string index
        // of where marker occured in book
        const before = markers[`${item.id}-${o.search}-1`];
        const after  = markers[`${item.id}-${o.search}-2`];

        // In book's content, where a search has before/after
        // :before: ... :main: ... :after:

        if (search.before) {
          // Marker could not be found
          if (before === undefined)
            return false;
          // User has yet to reach chapter where marker occurs
          else if (before.chapter > chapter)
            return false;
          // Match has yet to reach index in chapter where marker occurs
          else if (before.chapter == chapter && before.start > match.start)
            return false;
        }

        if (search.after) {
          // Marker could not be found
          if (after === undefined)
            return false;
          // User has passed chapter where marker occurs
          else if (after.chapter < chapter)
            return false;
          // Match has passed index within chapter where marker occurs
          else if (after.chapter == chapter && after.end < match.end)
            return false;
        }

        return true;
      });
    }

    const wrapped = annotateHTML.wrapMatches(
      matches, html, 'annotation', `${set.id}-${item.id}`
    );

    html = wrapped.html;

    // Update string indexes for current chapter's markers
    Object
      .keys(markers)
      .filter(marker => marker.chapter == chapter)
      .map(marker =>
        // Increase marker's string index by the wrapper's length every time
        // an annotation was inserted before the marker
        wrapped.inserts.map(index => {
          if (markers[marker].end > index) {
            markers[marker].end += wrapped.wrapLength,
            markers[marker].start += wrapped.wrapLength;
          }
        })
      );
  });

  document.body.innerHTML = html;

}