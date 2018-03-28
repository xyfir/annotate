Annotate HTML with annotations from [xyAnnotations](annotations.xyfir.com).

This is mostly a lower-level library to be used in other packages (like epubjs).

# API

Check the [source code](https://github.com/Xyfir/annotate/tree/master/html/src) and JSDOC comments for each module, they're heavily documented and should explain everything necessary.

The main methods you'll probably need are briefly described below.

## [findMarkers()](https://github.com/Xyfir/annotate/tree/master/html/src/find-markers.js)

```js
 const markers = AnnotateHTML.findMarkers(html, chapter, items)
```

- `html`: *string* - The HTML string to search for markers in
- `chapter`: *number* - The index of the chapter within the book
- `items`: *object[]* - The annotation set items to search
- `markers`: *object* - Markers that point to matches for Before and After subsearches within the chapter

## [insertAnnotations()](https://github.com/Xyfir/annotate/tree/master/html/src/insert-annotations.js)

```js
 const newHTML = AnnotateHTML.findMarkers({
    set,
    html,
    chapter,
    markers,
    onclick: (type, key) => `...`
 })
```

- `set`: *object* - The annotation set to insert
- `html`: *string* - The HTML string to insert annotations into
- `chapter`: *number* - The index of the chapter within the book
- `markers`: *object* - Markers that point to matches for Before and After subsearches within the book
- `onclick`: *function* - A template function that returns a string that will be used in the `onclick="..."` attribute for each highlight element inserted into the HTML. `type` is the type of highlight (should always be `annotation` unless you have some custom setup). `key` identifies the item being clicked with the following format: `'setId-itemId'`.

##

# Usage / Examples

You should check the [epubjs package](https://github.com/Xyfir/annotate/blob/master/epubjs/src) (`find-markers.js` and `insert.js` specifically) for a detailed, working example of this package being used.