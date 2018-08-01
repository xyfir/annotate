Annotate HTML with annotations from [xyAnnotations](annotations.xyfir.com).

This is mostly a lower-level library to be used in other packages (like epubjs).

# API

Check the [source code](https://github.com/Xyfir/annotate/tree/master/html/src) and JSDOC comments for each module, they're heavily documented and should explain everything necessary.

The main methods you'll probably need are briefly described below.

```js
import * as AnnotateHTML from '@xyfir/annotate-html';
```

## `findMarkers()`

```js
const markers = AnnotateHTML.findMarkers(html, chapter, items);
```

* `html`: _string_ - The HTML string to search for markers in
* `chapter`: _number_ - The index of the chapter within the book
* `items`: _object[]_ - The annotation set items to search
* `markers`: _object_ - Markers that point to matches for Before and After subsearches within the chapter

## `buildString()`

```js
const newHTML = AnnotateHTML.buildString({
  set,
  html,
  mode,
  action: (type, key) => `...`,
  chapter,
  markers
});
```

* `set`: _object_ - The annotation set to insert
* `html`: _string_ - The HTML string to insert annotations into
* `mode`: _number_ - See the `INSERT_MODES` export.
* `action`: _function_ - This is a template function that takes two parameters, `type` and `key`, and returns a `string` that will be used for the `onclick` or `href` attributes of the inserted element based on `mode`. `type` is the type of highlight (should always be `"annotation"` unless you have some custom setup). `key` identifies the item being clicked with the following format: `'setId-itemId'`.
* `chapter`: _number_ - The index of the chapter within the book
* `markers`: _object_ - Markers that point to matches for Before and After subsearches within the book

## `INSERT_MODES`

All inserted elements are given a `class` of `xy-{type}`, which usually should be `xy-annotation` unless you specified a custom type.

```js
AnnotateHTML.INSERT_MODES = {
  // Wrap the matches within an element
  WRAP: {
    // <a href="...">{match}</a>
    LINK,
    // <span onclick="...">{match}</span>
    ONCLICK
  },
  // Add a reference at the end of the match
  REFERENCE: {
    // {match}<a href="..."><sup>xy</sup></a>
    LINK,
    // {match}<span onclick="..."><sup>xy</sup></span>
    ONCLICK
  }
};

AnnotateHTML.buildString({ ...
  mode: AnnotateHTML.INSERT_MODES.WRAP.LINK
... });
```

# Usage / Examples

You should check the [epubjs package](https://github.com/Xyfir/annotate/blob/master/epubjs/src) (`find-markers.js` and `insert.js` specifically) for a detailed, working example of this package being used.
