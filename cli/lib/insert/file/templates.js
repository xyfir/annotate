const package = require('package.json');
const marked = require('marked');

const renderer = new marked.Renderer();
/**
 * Self-close `img` element for XML.
 * @param {string} href
 * @param {string} [title]
 * @param {string} [text]
 */
renderer.image = (href, title, text) =>
  `<img src="${href}" alt="${title || text}"/>`;

/** @param {AnnotationSet} set */
exports.NOTIFICATION_FOOTER = set => `
<footer class="xy-notification">
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
exports.FOOTNOTES_CONTAINER = (set, body) =>
  `
<?xml version='1.0' encoding='utf-8'?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${'en'}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>
    Footnotes Generated from xyAnnotations Set #${set.id}
  </title>
</head>
<body>${body}</body>
</html>`.trim();

/** @param {AnnotationSetItem} item */
exports.FOOTNOTES_ENTRY = item =>
  `
<div class="xy-footnote">
  <a name="item_${item.id}" id="item_${item.id}">
    <b>Annotations from item #${item.id}:</b>
  </a>
  <br/>
  ${
    item.annotations.length > 1
      ? item.annotations
          .map(
            (a, i) =>
              `<p><a href="#${item.id}_${i}">
                Annotation #${i + 1}: ${a.name}
               </a></p>`
          )
          .join('<br/>\n') +
        item.annotations
          .map(
            (a, i) =>
              `<a name="${item.id}_${i}" id="${item.id}_${i}">
                <b>Annotation #${i + 1}: ${a.name}</b>
               </a>
               <br/>\n\n` + marked(a.value, { sanitize: true, renderer })
          )
          .join('\n\n<hr/><hr/><hr/>')
      : marked(item.annotations[0].value, { sanitize: true, renderer })
  }
</div>`.trim();

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
