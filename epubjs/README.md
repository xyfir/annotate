Annotate [EPUB](http://idpf.org/epub) books using [Epub.js](https://github.com/futurepress/epub.js/) and [xyAnnotations](annotations.xyfir.com).

# Usage

```js
import AnnotateEPUBJS from '@xyfir/annotate-epubjs';
import EPUB from 'epubjs';

/**
 * @typedef {object} AnnotationSet
 * @prop {number} id
 * @prop {object[]} items
 */
/** @type {AnnotationSet} */
const annotationSet = {/* set from xyAnnotations API */};
const bookFile = 'a blob or a url probably';
const settings = {/* settings for Epub.js */};
const book = new EPUB(bookFile, settings);

// Insert annotation set's items into the book's HTML
AnnotateEPUBJS.insertAnnotations(book, annotationSet);

const [{document}] = book.rendition.getContents();

// Remove inserted annotations from book's HTML
// This must be done before inserting a different annotation set!
AnnotateEPUBJS.unwrapMatches(document, 'annotation');

/**
 * Triggered when highlighted text within the book's content is clicked.
 * @param {MessageEvent} event
 * @param {object} event.data
 * @param {boolean} event.data.epubjs
 * @param {string} event.data.key
 */
onHighlightClicked(event) {
  if (!event.data.epubjs) return;

  const [setId, itemId] = event.data.key.split('-');
}
window.addEventListener('message', onHighlightClicked);
```