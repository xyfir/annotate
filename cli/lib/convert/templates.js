const marked = require('marked');

const imgRenderer = new marked.Renderer();
/**
 * Self-close `img` element for XML.
 * @param {string} href
 * @param {string} [title]
 * @param {string} [text]
 */
imgRenderer.image = (href, title, text) =>
  `<img src="${href}" alt="${title || text}"/>`;

const linkOnlyRenderer = new marked.Renderer();
/**
 * Convert images to links.
 * @param {string} href
 * @param {string} [title]
 * @param {string} [text]
 */
linkOnlyRenderer.image = (href, title, text) =>
  `<a href="${href}">View Image: ${
    (title || text) && (title || text) != 'undefined'
      ? title || text
      : '(No Description)'
  }</a>`;

/**
 * Convert a single annotation set item annotation to XHTML.
 * @param {Annotation} a
 * @param {boolean} [linkOnly]
 * @return {string}
 */
const ANNOTATION_TO_XHTML = (a, linkOnly) => {
  switch (a.type) {
    case 1:
      return marked(a.value, {
        sanitize: true,
        renderer: linkOnly ? linkOnlyRenderer : imgRenderer
      });
    case 2:
      return `<a href="${a.value}">View Link</a>`;
    case 3:
      return `<ul>
        <li>
          <a href="https://www.google.com/search?q=${encodeURIComponent(
            a.value
          )}">
            Google Search: <i>${a.value}</i>
          </a>
        </li>
        ${
          a.context
            ? `<li>
                <a href="https://www.google.com/search?q=${encodeURIComponent(
                  `${a.context} ${a.value}`
                )}">
                  With Context: <i>${a.context} ${a.value}</i>
                </a>
              </li>`
            : ''
        }
      </ul>`;
    case 4:
      return `<ul>${(Array.isArray(a.value) ? a.value : a.value.split(','))
        .map(
          link =>
            `<li>
              <a href="${link}">View Image</a>
              ${linkOnly ? '' : `<br/><img src="${link}"/>`}
            </li>`
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
exports.ANNOTATION_TO_XHTML = ANNOTATION_TO_XHTML;

/**
 * Convert multiple annotation set item annotations to XHTML.
 * @param {AnnotationSetItem} item
 * @param {boolean} [linkOnly]
 * @return {string}
 */
const ANNOTATIONS_TO_XHTML = (item, linkOnly) =>
  `<ul>${item.annotations
    .map(
      (a, i) => `<li>
        <a href="#${item.id}_${i}">
          Annotation #${i + 1} in item #${item.id}: ${a.name}
        </a>
      </li>`
    )
    .join('\n')}</ul>` +
  item.annotations
    .map(
      (a, i) => `<div>
        <a name="${item.id}_${i}" id="${item.id}_${i}">
          <b>Annotation #${i + 1} in item #${item.id}: ${a.name}</b>
        </a>
        <br/>
        ${ANNOTATION_TO_XHTML(a, linkOnly)}
      </div>`
    )
    .join('\n\n');
exports.ANNOTATIONS_TO_XHTML = ANNOTATIONS_TO_XHTML;
