import findMatchingNodes from 'lib/reader/matches/find-nodes';
import escapeRegex from 'escape-string-regexp';

/**
 * @typedef {object} AnnotationMarker
 * @prop {number} chapter - Index of the chapter that the marker exists in.
 * @prop {number} [start] - The starting index within the Node's text that
 *  the marker exists at.
 * @prop {number} [end] - The ending index within the Node's text that
 *  the marker exists at.
 * @prop {Node} [node] - The Node that the marker exists in.
 */
/**
 * @typedef {object} AnnotationMarkers
 * @prop {AnnotationMarker} [${itemId}-${searchIndex}-${type}] - `itemId`
 * is the id of the item in the annotation set. `searchIndex` is the index of
 * the search within the item in the set. `type` is 1 for a 'before' marker and
 * 2 for an 'after' marker.
 */
/**
 * Finds instances of 'before' and 'after' subsearches within an annotation
 *  set's item's searches.
 * @async
 * @param {object} book - EPUBJS book
 * @param {object[]} items - Annotation set items
 * @return {AnnotationMarkers}
 */
export default async function(book, items) {

  const el = document.getElementById('book');

  /** @type {AnnotationMarkers} */
  const markers = {};

  // Hide bookView so user doesn't see chapter changes
  el.style.display = 'none';

  // Save current cfi and chapter index
  const currentChapter = book.rendition.location.start.index;
  const currentCFI = book.rendition.location.start.cfi;

  /** @param {number} chapter */
  const findMarkersInChapter = chapter => {
    const {body} = book.rendition.getContents()[0].document

    // Loop through all items in annotation set
    items.forEach(item =>
      // Loop through all search queries in item
      item.searches.forEach((search, searchIndex) => {
        // If search query is global, it doesn't have a before or after
        if (!search.before && !search.after) return;

        if (search.before) {
          // Before subsearches are assumed unique with only a single match
          const [match] = findMatchingNodes(
            body,
            new RegExp(search.regex ? search.before : escapeRegex(search.before))
          );

          if (match) {
            // Only chapter is needed if this is not the currrent chapter
            markers[`${item.id}-${searchIndex}-1`] = chapter == currentChapter
              ? Object.assign({ chapter }, match)
              : { chapter };
          }
        }

        if (search.after) {
          // After subsearches are assumed unique with only a single match
          const [match] = findMatchingNodes(
            body,
            new RegExp(search.regex ? search.after : escapeRegex(search.after))
          );

          if (match) {
            // Only chapter is needed if this is not the currrent chapter
            markers[`${item.id}-${searchIndex}-2`] = chapter == currentChapter
              ? Object.assign({ chapter }, match)
              : { chapter };
          }
        }
      })
    );
  }

  // Loop through all chapters, ignore current
  for (let section of book.navigation.toc) {
    await book.rendition.display(section.href);

    // Skip current chapter because we'll need a live reference for `node`
    const chapter = book.rendition.location.start.index;
    if (currentChapter == chapter) continue;

    findMarkersInChapter(chapter);
  }

  // Go back to current cfi
  await book.rendition.display(currentCFI);

  // Get full matches for current chapter
  findMarkersInChapter(currentChapter);

  // Show bookView again
  el.style.display = '';

  return markers;

}