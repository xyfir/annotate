import 'babel-polyfill';

import annotationSet from 'mocks/annotation-set';
import annotate from 'repo/epubjs';
import EPUB from 'epubjs';

// This is required for Epub.js to work
window.ePub = EPUB;
// These are just for testing
window.annotate = annotate,
window.annotationSet = annotationSet;

(async function() {

  // Book setup
  const book = new EPUB('/src/book.epub', {});
  window.book = book;
  const bookView = document.getElementById('bookView');

  // Render book to `div#bookView`
  book.renderTo(bookView, {
    height: window.getComputedStyle(bookView).height,
    width: window.innerWidth
  });

  try {
    // More book setup
    await book.ready;
    await book.rendition.display();
    await book.locations.generate(1000);

    // Add styles for highlights within book
    book.rendition.themes.default({
      'span.annotation': {
        'background-color': '#85C1E9',
        'cursor': 'pointer'
      }
    });
    book.rendition.themes.update('default');

    // Insert annotations into the first chapter of the book
    annotate.insertAnnotations(book, annotationSet);

    // Listen for clicks on a highlight within the book's iframe
    window.addEventListener('message', e => {
      if (!e.data.epubjs) return;

      const [set, item] = event.data.key.split('-');
      console.log('Click', item);
    });

    // Insert annotations when a new chapter is rendered
    book.rendition.on('rendered', () =>
      annotate.insertAnnotations(book, annotationSet)
    );
  }
  catch (err) {
    console.error(err);
  }

})();