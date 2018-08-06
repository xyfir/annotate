const {
  ANNOTATION_TO_XHTML,
  ANNOTATIONS_TO_XHTML
} = require('lib/convert/templates');
const package = require('package.json');
const path = require('path');

/** @param {AnnotationSet} set */
exports.NOTIFICATION_FOOTER = set => `<footer class="xy-notification">
  <p>
    This book has been annotated via <a href="https://www.npmjs.com/package/@xyfir/annotate-cli">
      annotate-cli
    </a> version <code>
      ${package.version}
    </code> on <code>
      ${new Date().toDateString()}
    </code> using the <a href="https://annotations.xyfir.com">
      xyAnnotations
    </a> annotation set <a href="https://annotations.xyfir.com/sets/${
      set.id
    }">#${set.id}</a> version <code>
      ${set.version}
    </code>.
  </p>
  <p>
    Please see the original annotation set for license, copyright, sourcing, and other relevant information regarding the annotations and the contents they were sourced from.
  </p>
  <p>
    This content may be outdated. Check the original annotation set for the latest version.
  </p>
</footer>`;

/**
 * @param {AnnotationSet} set
 * @param {string} body
 */
exports.FOOTNOTES_CONTAINER = (
  set,
  body
) => `<?xml version='1.0' encoding='utf-8'?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${'en'}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>
    Footnotes Generated from xyAnnotations Set #${set.id}
  </title>
</head>
<body>${body}</body>
</html>`;

/**
 * @param {AnnotationSetItem} item
 * @param {boolean} linkedOnly
 */
exports.FOOTNOTES_ENTRY = (item, linkedOnly) => `<div class="xy-footnote">
  <a name="item_${item.id}" id="item_${item.id}">
    <b>Annotations from item #${item.id}:</b>
  </a>
  <br/>
  ${
    item.annotations.length > 1
      ? ANNOTATIONS_TO_XHTML(item, linkedOnly)
      : ANNOTATION_TO_XHTML(item.annotations[0], linkedOnly)
  }
</div>`;

/**
 * @param {string} path
 * @param {number} count
 */
exports.FOOTNOTES_OPF_MANIFEST = (path, count) =>
  Array(count)
    .fill(0)
    .map(
      (e, i) =>
        `<item href="${path}/footnotes-${i}.html" id="xy_footnotes_${i}" media-type="application/xhtml+xml"/>`
    )
    .join('\n');

/** @param {number} count */
exports.FOOTNOTES_OPF_SPINE = count =>
  Array(count)
    .fill(0)
    .map((e, i) => `<itemref idref="xy_footnotes_${i}"/>`)
    .join('\n');

/**
 * Get relative path from `file` to `xypath`.
 * @param {string} file
 * @param {string} xypath
 */
exports.FOOTNOTES_PATH = (file, xypath) =>
  path.relative(path.dirname(file), xypath).replace(/\\/g, '/');
