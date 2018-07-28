const package = require('package.json');
const marked = require('marked');
const path = require('path');

const renderer = new marked.Renderer();
/**
 * @param {string} href
 * @param {string} [title]
 * @param {string} [text]
 */
renderer.image = (href, title, text) =>
  `<a href="${href}">View Image: ${
    (title || text) && (title || text) != 'undefined'
      ? title || text
      : '(No Description)'
  }</a>`;

/**
 * Basic HTML file template.
 * @param {AnnotationSet} set
 * @param {string} body
 */
const HTML = (set, body) => `
<!DOCTYPE html>
<html xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:mbp="http://www.kreutzfeldt.de/mmc/mbp"
  xmlns:idx="http://www.mobipocket.com/idx"
  lang="${'en'}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>
    Kindle Dictionary Generated from xyAnnotations Set #${set.id}
  </title>
</head>
<body>${body}</body>
</html>`;

/**
 * Converts item into dictionary entry.
 * @param {AnnotationSetItem} item
 */
const ENTRY = item => `
<idx:entry id="${item.id}" name="${'xy'}" spell="yes" scriptable="yes">
  <a id="${item.id}" name="${item.id}"/>

  <div class="orth">
  <idx:orth value="${item.searches[0]}">
    <span><b>${item.searches[0]}</b></span>

    ${
      item.searches.length > 1
        ? `<idx:infl>${item.searches
            .slice(1)
            .map(s => `<idx:iform value="${s}"/>`)
            .join('')}</idx:infl>`
        : ''
    }
  </idx:orth>
  </div>

  ${DEFINITIONS(item)}
</idx:entry>`;

/**
 * Converts item annotations into definitions.
 * @param {AnnotationSetItem} item
 */
const DEFINITIONS = item =>
  item.annotations.length > 1
    ? item.annotations
        .map(
          (a, index) => `<p><a href="#${item.id}-${index}">${a.name}</a></p>`
        )
        .join('<br/>\n') +
      item.annotations
        .map(
          (a, index) =>
            `<a name="${item.id}-${index}"/>` +
            `<p>Entry #${index + 1}: ${a.name}</p><br/>\n\n` +
            marked(a.value, { sanitize: true, renderer })
        )
        .join('\n\n<hr/><hr/><hr/>')
    : marked(item.annotations[0].value, {
        sanitize: true,
        renderer
      });

/**
 * Generate body for `title.html`.
 * @param {AnnotationSet} set
 */
const TITLE_BODY = set => `
<a id="title" name="title"/>
<div class="title-page">
  <p>
    This dictionary was generated via <a href="https://www.npmjs.com/package/@xyfir/annotate-cli">annotate-cli</a> version <code>${
      package.version
    }</code> on <code>${new Date().toDateString()}</code> using annotation set <a href="https://annotations.xyfir.com/sets/${
  set.id
}">#${set.id}</a> version <code>${set.version}</code>.
  </p>
  <p>
    Please see the original annotation set for license, copyright, sourcing, and other relevant information regarding this dictionary and the contents it was sourced from.
  </p>
  <p>
    This content may be outdated. Check the original annotation set for the latest version.
  </p>
</div>`;

/**
 * Generate body for `toc.html`.
 * @param {AnnotationSet} set
 * @param {string[]} letters
 */
const TOC_BODY = (set, letters) => `
<a id="toc" name="toc"/>
<nav epub:type="toc">
  <h1>Table of Contents</h1>
  <ol>
    <li><a href="title.html#title">Title</a></li>
    <li><a href="toc.html#toc">Table of Contents</a></li>
    ${letters
      .map(
        l =>
          `<li><a href="defs-${l}.html#defs${l}">${
            l == 'misc' ? 'Misc.' : l.toUpperCase()
          } Definitions</a></li>`
      )
      .join('\n    ')}
  </ol>
</nav>`;

/**
 * Returns contents for `dict.opf`.
 * @param {AnnotationSet} set
 * @param {string[]} letters
 */
exports.DICT_OPF = (set, letters) => `
<?xml version="1.0" encoding="utf-8"?>
<package unique-identifier="uid">
  <metadata>
    <dc-metadata xmlns:dc="http://purl.org/metadata/dublin_core" xmlns:oebpackage="http://openebook.org/namespaces/oeb-package/1.0/">
      <dc:Title>Dictionary from xyAnnotations Set #${set.id}</dc:Title>
      <dc:Language>${'en'}</dc:Language>
      <dc:Creator>xyAnnotations</dc:Creator>
      <dc:Description>
        A dictionary created from the xyAnnotations annotation set #${
          set.id
        }, version ${set.version}. See set for more information.
      </dc:Description>
      <dc:Date>${new Date().toISOString()}</dc:Date>
    </dc-metadata>
    <x-metadata>
      <output encoding="utf-8" content-type="text/x-oeb1-document"></output>
      <EmbeddedCover>
        ${path.resolve(
          path.dirname(require.main.filename),
          'res',
          'dictionary_cover.png'
        )}
      </EmbeddedCover>
      <DictionaryInLanguage>${'en'}</DictionaryInLanguage>
      <DictionaryOutLanguage>${'en'}</DictionaryOutLanguage>
      <DefaultLookupIndex>${'xy'}</DefaultLookupIndex>
    </x-metadata>
  </metadata>
  <manifest>
    <item id="toc" properties="nav" href="toc.html" media-type="application/xhtml+xml"/>
    <item id="cimage" media-type="image/png" href="${path.resolve(
      path.dirname(require.main.filename),
      'res',
      'dictionary_cover.png'
    )}" properties="coverimage"/>
    <item id="title" href="title.html" media-type="application/xhtml+xml"/>
    ${letters
      .map(
        l =>
          `<item id="defs${l}" href="defs-${l}.html" media-type="application/xhtml+xml"/>`
      )
      .join('\n    ')}
  </manifest>
  <spine toc="toc">
    <itemref idref="toc"/>
    <itemref idref="cimage"/>
    <itemref idref="title"/>
    ${letters.map(l => `<itemref idref="defs${l}"/>`).join('\n    ')}
  </spine>
  <guide>
    <reference type="toc" title="Table of Contents" href="toc.html"></reference>
  </guide>
</package>`;

/**
 * Returns contents for `defs.html`.
 * @param {AnnotationSet} set
 * @param {string} letter
 */
exports.DEFS_HTML = (set, letter) =>
  HTML(
    set,
    `<a id="defs${letter}" name="defs${letter}"/>` +
      `<mbp:frameset>${set.items
        .filter(i => {
          /** @type {string} */
          const l = i.searches[0][0].toLowerCase();
          return letter == 'misc' &&
            (l.charCodeAt(0) < 97 || l.charCodeAt(0) > 122)
            ? true
            : l == letter;
        })
        .map(i => ENTRY(i))
        .join('\n\n<hr/>')}</mbp:frameset>`
  );

/**
 * Returns contents for `title.html`.
 * @param {AnnotationSet} set
 */
exports.TITLE_HTML = set => HTML(set, TITLE_BODY(set));

/**
 * Returns contents for `toc.html`.
 * @param {AnnotationSet} set
 * @param {string[]} letters
 */
exports.TOC_HTML = (set, letters) => HTML(set, TOC_BODY(set, letters));
