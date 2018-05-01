Annotate HTML with annotations from [xyAnnotations](annotations.xyfir.com).

This is mostly a lower-level library to be used in other packages (like epubjs).

# API

Check the [source code](https://github.com/Xyfir/annotate/tree/master/html/src) and JSDOC comments for each module, they're heavily documented and should explain everything necessary.

The main methods you'll probably need are briefly described below.

## [findMarkers()](https://github.com/Xyfir/annotate/tree/master/html/src/find-markers.js)

```js
const markers = AnnotateHTML.findMarkers(html, chapter, items);
```

* `html`: _string_ - The HTML string to search for markers in
* `chapter`: _number_ - The index of the chapter within the book
* `items`: _object[]_ - The annotation set items to search
* `markers`: _object_ - Markers that point to matches for Before and After subsearches within the chapter

## [insertAnnotations()](https://github.com/Xyfir/annotate/tree/master/html/src/insert.js)

```js
const newHTML = AnnotateHTML.insertAnnotations({
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
* `mode`: _string_ - When `normal`, the matches are wrapped in a `span` element with an `onclick` attribute. When `link`, the matches are wrapped in a `<a>` element with an `href` attribute.
* `action`: _function_ - A template function that returns a string that will be used in the element's attribute (`onclick` or `href`) for each highlight element inserted into the HTML. `type` is the type of highlight (should always be `annotation` unless you have some custom setup). `key` identifies the item being clicked with the following format: `'setId-itemId'`.
* `chapter`: _number_ - The index of the chapter within the book
* `markers`: _object_ - Markers that point to matches for Before and After subsearches within the book

##

# Usage / Examples

You should check the [epubjs package](https://github.com/Xyfir/annotate/blob/master/epubjs/src) (`find-markers.js` and `insert.js` specifically) for a detailed, working example of this package being used.
