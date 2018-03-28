View annotations inserted into content from [xyAnnotations](annotations.xyfir.com) using React components.

In its current form, this package requires [react-md](https://github.com/mlaursen/react-md). This means there are additional things you will need to import and build in order for this to work properly. You must import: 1) the react-md styles; 2) the Material Icons font; 3) The Roboto font; 4) this package (`@xyfir/annotate-react`). See the [examples](#examples) for more info.

# API

This package exports an object containing the following React components.

## `<ViewAnnotations />`

This is the main one you should be concerned with. If this is the component you use then you can safely ignore the rest because this one will load the others as needed. The only prop it accepts is `annotations` and this should be an object array of an annotation set item's annotations.

## Others

All of the other exported components (`Document`, `Link`, `Search`, `Image`, `Video`, `Audio`, and `Map`) render a single annotation of the appropriate type. They all accept a single `annotation` prop that is a single annotation within an annotation set item.

# Examples

Check the source code for [tests](https://github.com/Xyfir/annotate/tree/master/tests/src).