import findMatchIndexes from './find-indexes';
import { escapeRegex } from 'repo/core';

/**
 * @typedef {object} AnnotationMarker
 * @prop {number} chapter - Index of the chapter that the marker exists in.
 * @prop {number} start - Index of the character in the chapter HTML string
 * that the marker starts at.
 * @prop {number} end - Index of the character in the chapter HTML string
 * that the marker ends at.
 */
/**
 * @typedef {object} AnnotationMarkers
 * @prop {AnnotationMarker} [${itemId}-${searchIndex}-${type}] - `itemId`
 * is the id of the item in the annotation set. `searchIndex` is the index of
 * the search within the item in the set. `type` is 1 for a 'before' marker and
 * 2 for an 'after' marker.
 */
/**
 * Finds locations of Before and After subsearch matches from an annotation
 *  set's item's searches within an HTML string.
 * @param {string} html - HTML string for the provided chapter.
 * @param {number} chapter - The index of the chapter within the book.
 * @param {object[]} items - Annotation set items
 * @return {AnnotationMarkers}
 */
export default function(html, chapter, items) {
  /** @type {AnnotationMarkers} */
  const markers = {};

  // Loop through all items in annotation set
  items.forEach(item =>
    // Loop through all search queries in item
    item.searches.forEach((search, searchIndex) => {
      // If search query is global, it doesn't have a before or after
      if (typeof search == 'string' || (!search.before && !search.after))
        return;

      if (search.before) {
        // Before subsearches are assumed unique with only a single match
        const [match] = findMatchIndexes(
          new RegExp(
            search.regex ? search.before : escapeRegex(search.before),
            'g'
          ),
          html
        );

        if (match) {
          match.chapter = chapter;
          markers[`${item.id}-${searchIndex}-1`] = match;
        }
      }

      if (search.after) {
        // After subsearches are assumed unique with only a single match
        const [match] = findMatchIndexes(
          new RegExp(
            search.regex ? search.after : escapeRegex(search.after),
            'g'
          ),
          html
        );

        if (match) {
          match.chapter = chapter;
          markers[`${item.id}-${searchIndex}-2`] = match;
        }
      }
    })
  );

  return markers;
}
