import annotateHTML from 'repo/html';

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
 *  set's item's searches within the book's chapters.
 * @async
 * @param {object} book - EPUBJS book
 * @param {object[]} items - Annotation set items
 * @return {AnnotationMarkers}
 */
export default async function(book, items) {

  /** @type {AnnotationMarkers} */
  const markers = {};

  // Used to render each chapter
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  // Loop through all files in book
  for (let spineItem of book.spine.items) {
    // Ignore non-html files
    if (!/html$/.test(spineItem.href.split('.').slice(-1)[0])) continue;

    const file =
      book.archive.zip.files[spineItem.href] ||
      book.archive.zip.files[`OEBPS/${spineItem.href}`];

    if (!file) continue;

    /** @type {string} */
    let html = await file.async('string');

    // Convert file content into html string
    iframe.contentDocument.documentElement.innerHTML = html,
    html = iframe.contentDocument.body.innerHTML;

    // Find markers within the chapter's HTML
    Object.assign(
      markers,
      annotateHTML.findMarkers(html, spineItem.index, items)
    );
  }

  iframe.remove();

  return markers;

}