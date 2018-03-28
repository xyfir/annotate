import 'babel-polyfill';

import annotationSets from 'mocks/annotation-sets';
import AnnotateEPUBJS from 'repo/epubjs';
import AnnotateReact from 'repo/react';
import { render } from 'react-dom';
import React from 'react';
import EPUB from 'epubjs';

// This is required for Epub.js to work
window.ePub = EPUB;
// These are just for testing
window.AnnotateReact = AnnotateReact,
window.AnnotateEPUBJS = AnnotateEPUBJS,
window.annotationSets = annotationSets;

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

    // Listen for clicks on a highlight within the book's iframe
    window.addEventListener('message', e => {
      if (!e.data.epubjs) return;

      const [setId, itemId] = event.data.key.split('-');
      const set  = annotationSets.find(s => s.id == setId);
      const item = set.items.find(i => i.id == itemId);

      render(
        <AnnotateReact.ViewAnnotations annotations={item.annotations} />,
        document.getElementById('viewAnnotations')
      );
    });

    /** @type {Document} */
    let fdocument = book.rendition.getContents()[0].document;
    let oghtml = fdocument.body.innerHTML;
    let set = -1;

    // Insert annotations, update vars when a new chapter is rendered
    book.rendition.on('rendered', () => {
      fdocument = book.rendition.getContents()[0].document,
      oghtml = fdocument.body.innerHTML;

      if (set > -1)
        AnnotateEPUBJS.insertAnnotations(book, annotationSets[set]);
    });

    // Button controls
    document.getElementById('prev').addEventListener('click', () => {
      book.rendition.prev();
    });
    document.getElementById('next').addEventListener('click', () => {
      book.rendition.next();
    });
    document.getElementById('cycleSets').addEventListener('click', () => {
      set = annotationSets[set + 1] == undefined ? 0 : set + 1;
      fdocument.body.innerHTML = oghtml;
      AnnotateEPUBJS.insertAnnotations(book, annotationSets[set]);
    });

    /**
     * ---------- ----- ----------
     * ---------- TESTS ----------
     * ---------- ----- ----------
     * These tests are highly flawed and entirely dependent on the book and the
     *  annotation sets. They're better than nothing, but don't assume a pass
     *  here means everything is working perfectly.
     * @todo Validate clicks on highlights
     * @todo Validate total number of nodes/elements in document.body
     */
    for (let set of annotationSets) {
      console.log('Inserting and validating set #', set.id);
      await AnnotateEPUBJS.insertAnnotations(book, set);

      const ans = fdocument.querySelectorAll('span.annotation');

      // Validate the number of `span.annotation` elements created
      if (ans.length != set.elements)
        throw `Bad element count ${ans.length}`;

      // Validate the text content of all highlights
      for (let el of ans) {
        if (set.matches.findIndex(m => m == el.textContent) == -1)
          throw `Bad element content ${el.textContent}`;
      }

      // Reset book's html
      fdocument.body.innerHTML = oghtml;
    }

    console.log('All tests passed');
  }
  catch (err) {
    console.error(err);
  }

})();