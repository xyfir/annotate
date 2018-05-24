View annotations inserted into content from [xyAnnotations](annotations.xyfir.com) using React components.

In its current form, this package requires [react-md](https://github.com/mlaursen/react-md). This means there are additional things you will need to import and build in order for this to work properly. You must import: 1) the react-md styles; 2) the Material Icons font; 3) The Roboto font; 4) this package (`@xyfir/annotate-react`). See the [examples](#examples) for more info.

# API

This package exports an object containing the following React components.

## `<ViewAnnotations />`

This is the main one you should be concerned with. If this is the component you use then you can safely ignore the rest because this one will load the others as needed.

**Props:**

* `annotations`: `object[]` _required_ - An annotation set item's annotations
* `onGoToLink`: `function` _required_ - Called whenever the user clicks a link, either to go to the source of an annotation, or to go to a link within a Document. The function should accept a single parameter that is the link (`string`) that you should navigate the user to. Pass `window.open` if you don't need any custom link handling.
* `onClose`: `function` _optional_ - When present, a 'close' action button will be added to the toolbar that will call this function on click.
* `book`: `{ title: string, authors: string }` _optional_ - Information for the book being viewed

## `<Document>`, `<Link>`, `<Search>`, `<Image>`, `<Video>`, `<Audio>`, `<Map>`

**Props:**

* `annotation`: `object` _required_ - A single annotation set item annotation (`set.items[i].annotations[j]`).

## `<Search>`

**Props:**

* `book`: described above

## `<Document>`, `<Link>`, `<Map>`

**Props:**

* `onGoToLink`: described above

# Examples

Check the source code for [tests](https://github.com/Xyfir/annotate/tree/master/tests/src).
