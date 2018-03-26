import escapeRegex from 'escape-string-regexp';

// Modules
import findMatchingNodes from 'lib/reader/matches/find-nodes';
import buildSearchOrder from 'lib/reader/annotations/build-search-order';
import findMarkers from 'lib/reader/annotations/find-markers';
import wrapMatches from 'lib/reader/matches/wrap';

/**
 * @typedef {object} AnnotationSet
 * @prop {object[]} items
 * @prop {number} id
 */
/**
 * Finds and highlights an annotation set's items within the ebook's rendered
 * HTML.
 * @async
 * @param {object} book - An EPUBJS book
 * @param {AnnotationSet} set - An annotation set
 */
export default async function(book, set) {

  // Create a flat, sorted array of all searches in all items
  const searchOrder = buildSearchOrder(set.items);

  // Find markers for all Before and After subsearches
  // This must run first before we get any references to the current document
  const markers = await findMarkers(book, set.items);

  const wordChar = /[A-Za-z0-9]/;
  const {body} = book.rendition.getContents()[0].document;

  // Get current chapter index to compare with chapter in markers
  const chapter = book.rendition.location.start.index;

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

    // Find deepest nodes that match search
    let matches = findMatchingNodes(body, needle);

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
          // Marker and match exist in same chapter
          else if (before.chapter == chapter) {
            const position = match.node.compareDocumentPosition(before.node);

            // Match has yet to reach node where marker occurs
            if (position & Node.DOCUMENT_POSITION_PRECEDING)
              return false;
            // Match has yet to reach index in node where marker occurs
            else if (before.start > match.start)
              return false;
          }
        }

        if (search.after) {
          // Marker could not be found
          if (after === undefined)
            return false;
          // User has passed chapter where marker occurs
          else if (after.chapter < chapter)
            return false;
          // Marker and match exist in same chapter
          else if (after.chapter == chapter) {
            const position = match.node.compareDocumentPosition(after.node);

            // Match has passed node where marker occurs
            if (position & Node.DOCUMENT_POSITION_FOLLOWING)
              return false;
            // Match has passed index within node where marker occurs
            else if (after.end < match.end)
              return false;
          }
        }

        return true;
      });
    }

    // Wrap matches
    const wrapped = wrapMatches(matches, 'annotation', `${set.id}-${item.id}`);

    // Update string indexes within markers{}
    // ** Only increase if in same node!
    Object
      .keys(markers)
      .filter(marker => marker.chapter == chapter)
      .map(marker =>
        // Increase marker's string indexes by the wrapper's length every time
        // an annotation was inserted before the marker
        wrapped.inserts.map(insertIndex => {
          if (markers[marker].start > insertIndex) {
            markers[marker].end += wrapped.wrapLength,
            markers[marker].start += wrapped.wrapLength;
          }
        })
      );
  });

}