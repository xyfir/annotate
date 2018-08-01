A collection of libraries for annotating content in various formats using data from [xyAnnotations](annotations.xyfir.com).

- [Epub.js](https://github.com/Xyfir/annotate/tree/master/epubjs): **Insert** annotations into EPUB books rendered with Epub.js v0.3.
- [HTML](https://github.com/Xyfir/annotate/tree/master/html): **Insert** annotations into HTML strings. Allows you to annotate books or just about anything that renders to HTML.
- [DOM](https://github.com/Xyfir/annotate/tree/master/dom): **Insert** annotations into the HTML DOM. _(abandoned / incomplete)_
- [React](https://github.com/Xyfir/annotate/tree/master/react): **View** annotations using React components.
- [Tests](https://github.com/Xyfir/annotate/tree/master/tests): Tests and examples for the rest of the packages.
- [Core](https://github.com/Xyfir/annotate/tree/master/core): Core utilities used by other packages.
- [CLI](https://github.com/Xyfir/annotate/tree/master/cli): Command line tools for generating and inserting annotations from and to multiple different sources and targets.

These packages assume you already have access to the xyAnnotations API and can download annotation sets which need to be inserted into some content (probably an ebook). If you're not at that point yet you should probably start [here](https://annotations.xyfir.com/affiliate) or [here](https://annotations.xyfir.com/forums/6/103.developers). Feel free to submit an issue or [send us a message](https://www.xyfir.com/#/contact) if you're confused!

# Contributing

Any improvements or fixes are greatly appreciated, just submit a pull request.

The most important thing if you're interested in contributing, is understanding how the build process and dependencies work. Each package has its own contained build process (through Webpack) and its own dependencies.

For example, due to the way the dependency system works, if you make a change in `html`, and want to see that change in `tests`, you have to do:

```bash
$ cd html
$ webpack-cli # build changes in html package
$ cd ../epubjs
$ webpack-cli # update epubjs to use new html build
$ cd ../tests
$ webpack-cli # update tests to use new epubjs (and html) build
$ node src/server
```

The full build command, called from the root repo directory:

```bash
$ cd core && webpack-cli && cd ../html && webpack-cli && cd ../epubjs && webpack-cli && cd ../react && webpack-cli && cd ../tests && webpack-cli && cd ../ && node tests/src/server
```

Note that you should first `npm link` the appropriate packages to load the locally modified copies.
