Annotate [EPUB](http://idpf.org/epub) books using [Epub.js](https://github.com/futurepress/epub.js/) v0.3 and [xyAnnotations](annotations.xyfir.com).

# Usage / Examples

You should check the [tests folder](https://github.com/Xyfir/annotate/blob/master/tests) (and `test.js` specifically) for a more detailed, working example of this package being used.

While the module contains many methods that you can use for more complex integrations (see the source for more info), the only method you really need is `AnnotateEPUBJS.insertAnnotations(book, annotationSet)`, where `book` is the Epub.js `Book` instance and `annotationSet` is an annotation set object as received from `annotations.xyfir.com/api/sets/:set/download`.

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

// The book iframe's document
const [{document}] = book.rendition.getContents();

// The document body's HTML *before* annotations are inserted
const oghtml = document.body.innerHTML;

// Insert annotation set's items into the book's HTML
AnnotateEPUBJS.insertAnnotations(book, annotationSet);

// Remove inserted annotations from book's HTML
// This must be done before inserting a different annotation set!
document.body.innerHTML = oghtml;

// Triggered when highlighted text within the book's content is clicked
function onHighlightClicked(event) {
  if (!event.data.epubjs) return;

  const [setId, itemId] = event.data.key.split('-');

  // handle viewing annotations of itemId in setId...
}
window.addEventListener('message', onHighlightClicked);
```