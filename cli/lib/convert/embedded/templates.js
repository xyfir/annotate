const package = require('package.json');
const marked = require('marked');
const path = require('path');

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
      ? FOOTNOTES_ANNOTATIONS(item)
      : FOOTNOTES_ANNOTATION(item.annotations[0])
  }
</div>`.trim();

/** @param {AnnotationSetItem} item */
const FOOTNOTES_ANNOTATIONS = item =>
  `
  <ul>${item.annotations
    .map((a, i) =>
      `
        <li>
          <a href="#${item.id}_${i}">
            Annotation #${i + 1} for item #${item.id}: ${a.name}
          </a>
        </li>
      `.trim()
    )
    .join('\n')}</ul>

  ${item.annotations
    .map((a, i) =>
      `
        <div>
          <a name="${item.id}_${i}" id="${item.id}_${i}">
            <b>Annotation #${i + 1} for item #${item.id}: ${a.name}</b>
          </a>
          <br/>
          ${FOOTNOTES_ANNOTATION(a)}
        </div>
      `.trim()
    )
    .join('\n\n')}
`;

/** @param {Annotation} a */
const FOOTNOTES_ANNOTATION = a => {
  switch (a.type) {
    case 1:
      return marked(a.value, { sanitize: true, renderer });
    case 2:
      return `<a href="${a.value}">View Link</a>`;
    case 3:
      return `
        <ul>
          <li>
            <a href="https://www.google.com/search?q=${encodeURIComponent(
              a.value
            )}">
              Google Search: <i>${a.value}</i>
            </a>
          </li>
          ${
            a.context
              ? `
                <li>
                  <a href="https://www.google.com/search?q=${encodeURIComponent(
                    `${a.context} ${a.value}`
                  )}">
                    With Context: <i>${a.context} ${a.value}</i>
                  </a>
                </li>
                `.trim()
              : ''
          }
        </ul>`.trim();
    case 4:
      return `<ul>${(Array.isArray(a.value) ? a.value : a.value.split(','))
        .map(link =>
          `
            <li>
              <a href="${link}">View Image</a>
              <br />
              <img src="${link}"/>
            </li>
          `.trim()
        )
        .join('\n')}</ul>`;
    case 5:
      return `<ul>${(Array.isArray(a.value) ? a.value : a.value.split(','))
        .map(id => {
          switch (a.source) {
            case 'youtube':
              return `<li><a href="https://youtu.be/${id}">YouTube Video</a></li>`;
            case 'vimeo':
              return `<li><a href="https://vimeo.com/${id}">Viemo Video</a></li>`;
            default:
              return '';
          }
        })
        .join('\n')}</ul>`;
    case 6:
      return `<ul>${(Array.isArray(a.value) ? a.value : a.value.split(','))
        .map(id => {
          switch (a.source) {
            case 'soundcloud':
              return `<li><a href="https://soundcloud.com/${id}">Soundcloud Track</a></li>`;
            default:
              return '';
          }
        })
        .join('\n')}</ul>`;
    case 7:
      return /^https?:\/\//.test(a.value)
        ? `<a href="${a.value}">View Map</a>`
        : `<a href="https://www.google.com/maps?q=${encodeURIComponent(
            a.value
          )}">Google Maps: <i>${a.value}</i></a>`;
  }
};

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
