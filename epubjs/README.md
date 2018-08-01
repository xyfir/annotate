Annotate [EPUB](http://idpf.org/epub) books using [Epub.js](https://github.com/futurepress/epub.js/) v0.3 and [xyAnnotations](https://annotations.xyfir.com).

# Usage / Examples

Check the [tests folder](https://github.com/Xyfir/annotate/blob/master/tests) (and `test.jsx` specifically) for a detailed, up-to-date, working example of this package being used.

While the module contains many methods that you can use for more complex integrations (see the source for more info), the only method you really need is `AnnotateEPUBJS.insertAnnotations(book, annotationSet)`, where `book` is the Epub.js `Book` instance and `annotationSet` is an annotation set object as received from `GET annotations.xyfir.com/api/sets/:set/download`.
