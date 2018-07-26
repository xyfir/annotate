const marked = require('marked');
const path = require('path');

const renderer = new marked.Renderer();
/**
 * @param {string} href
 * @param {string} [title]
 * @param {string} [text]
 */
renderer.image = (href, title, text) =>
  `<a href="${href}">View Image${
    (title || text) && (title || text) != 'undefined'
      ? `: ${title || text}`
      : ''
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
<idx:entry id="${item.id}" name="xy" spell="yes" scriptable="yes">
  <a id="${item.id}" name="${item.id}"/>

  <div class="orth">
  <idx:orth value="${item.searches[0]}">
    <span><b>${item.searches[0]}</b></span>

    <idx:infl>
      ${item.searches
        .slice(1)
        .map(s => `<idx:iform value="${s}"/>`)
        .join('')}
    </idx:infl>
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
 * Returns contents for `dict.opf`.
 * @param {AnnotationSet} set
 */
exports.DICT_OPF = set => `
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
      <DefaultLookupIndex>xy</DefaultLookupIndex>
    </x-metadata>
  </metadata>
  <manifest>
    <item id="item1" href="dict.html" media-type="application/xhtml+xml"></item>
  </manifest>
  <spine toc="toc">
    <itemref idref="item1"/>
  </spine>
  <guide>
    <reference type="toc" title="Table of Contents" href="dict.html#toc"></reference>
  </guide>
</package>`;

/**
 * Returns contents for `dict.html`.
 * @param {AnnotationSet} set
 */
exports.DICT_HTML = set =>
  HTML(
    set,
    `<mbp:frameset>${set.items
      .map(i => ENTRY(i))
      .join('\n\n<hr/>')}</mbp:frameset>`
  );
