Formerly known as auto-annotator, **annotate-cli** is a set of command line tools that allow you to that allows you to work with [xyAnnotations](https://annotations.xyfir.com/) in various ways, like creating or inserting annotations from/into ebooks.

# Install

```bash
npm install -g @xyfir/annotate-cli
# or
git clone <repo>
cd annotate/cli
npm install -g

# and then
annotate <command> [options/config]
```

# Commands

Before you get started with using annotate-cli, it's important to know how to properly use it. Due to many of its commands being configuration-heavy, you can either pass in arguments directly via options or through `--config <path>` that points to a JSON file containing an object with all of your configuration properties. Additionally, for programmatic use, you can pass in the same JSON object stringified via `--jsonconfig <json>`, just make sure to wrap it in `"{...}"` and then escape the contained double quotes. You can mix all three methods of passing data to annotate-cli if you wish, and they'll all be merged together, with `--[option]` overwriting values from `--jsonconfig` which overwrites values from `--config`.

## `insert file`

```
annotate insert file --file /path/to/file.epub --set 1234
```

Creates a copy of the epub file and inserts links to view annotations for matches of searches within items in the provided annotation set. This should allow you to view annotations from within any ebook reader that supports epub, regardless of whether that reader supports xyAnnotations.

**Note**: A xyAnnotations subscription and the `xyfirAnnotationsSubscriptionKey` config key are required.

### Options

- `set`: `number` - The id of the annotation set to insert into the ebook.
- `file`: `string` - Path to an epub file. A modified copy will be created next to this file.
- `mode`: `string` - _optional_ - Determines how the annotations are inserted into the file. `reference` (default) adds link at the end of match as `[xy]`; `wrap` puts link around entire match.
- `convert`: `boolean` - _optional_ - Attempts to convert the original source file to EPUB prior to inserting annotations into it. **Note:** You will need Calibre installed and its binaries available to the command line for this to work.
- `deleteSource: boolean` - _optional_ - Deletes the source file on success. If `--convert` is provided it also deletes the converted file.

## `generate calibre`

```
annotate generate calibre
```

This command loads your Calibre library, loops through the books, and creates annotation sets and annotation set items for each book that shouldn't be ignored.

**Note:** You will need Calibre installed for this to work.

### Options

- `limit`: `number`
  - Stop after the specified number of annotation sets are created. Ignored or skipped books do not count.
- `ids`: `number|string`
  - Ignore all books other than those with the ids provided. Can be a single id or a list of ids (`1,55,100`).
- `startAt`: `number`
  - Skip all books before the book with the provided id. Defaults to `0`.
- `stopAt`: `number`
  - Stop generating after the book with the provided id. You should provide this value if possible to prevent annotate-cli from quitting if it assumes that it has reached the end of the library.
  - Defaults to `99999999`, and may quit before.
- `library`: `string`
  - The path to the Calibre library you wish to generate annotations for.
  - Should contain a metadata.db file and folders for each author.
- `bin`: `string`
  - The path to Calibre's binaries.
  - Can be left empty if its already globally available.
- `deleteGeneratedFormat`: `boolean`
  - Default: `true`
  - xyAnnotations generates annotations from a text file. If a book does not have a text format, one is generated from the first format available. If this is true, that generated file is deleted after it is used.
- `addGeneratedFormat`: `boolean`
  - Default: `false`
  - If true, the generated text file is added to the book as another format.
  - If true, deleteGeneratedFormat is ignored.

## `generate libgen`

```
annotate generate libgen
```

This command can most likely be ignored. It is used by the AutoAnnotator bot account on xyAnnotations.

This command requires a local copy of the Library Genesis database (libgen_YYYY-MM-DD.rar) taken from [LibGen's database dumps](http://gen.lib.rus.ec/dbdumps/)). Only the `updated_edited` table is used. It pulls the needed metadata for books from the LibGen database, downloads a temporary copy of the ebook (directly from LibGen's actual server), generates annotations with that book, and then deletes the book.

### Options

- `limit: number` - Stop after the specified number of books are pulled from the database. Unlike the `generate calibre` command, books that were skipped are counted towards the limit.
- `calibreBinPath`: `string`
  - The path to Calibre's binaries.
  - Can be left empty if its already globally available.
- `database.name`: `string`
  - Default: `"libgen"`
  - The name of the local LibGen database.
- `database.host`: `string`
  - Default `"localhost"`
  - The host for the local LibGen database.
- `database.user`: `string`
  - Default `"root"`
  - Username for the local LibGen database.
- `database.pass`: `string`
  - Password for the local LibGen database.
- `lastId`: `number`
  - Default `0`
  - The id of the last book in the LibGen database that was handled in the `generate libgen` command.
  - Will be updated on its own should be left alone unless you want the command to start at a specific location.

### Notes

- Calibre still needs to be installed because Calibre's `ebook-convert` is used.
- This command will not interfere with or use your Calibre library.

## `generate mediawiki`

```
annotate generate mediawiki
```

Creates, updates, and deletes items in the specified annotation set using the pages in a MediaWiki dump file.

For Wikia, dumps can be found at [http://community.wikia.com/wiki/Special:Statistics](http://community.wikia.com/wiki/Special:Statistics) where `community` is replaced with the name of the Wikia site you wish to download data from.

If the wiki does not have public dumps available for download, you can use the [wikiteam](https://github.com/WikiTeam/wikiteam) tools.

### Options

```js
{
  // The id of the annotation set
  // Your account should be the creator or have moderator access
  "set": 123,
  // The base url to the MediaWiki site that the dump matches
  // No trailing slash!
  "url": "http://tolkiengateway.net",
  // The url for the MediaWiki API endpoint
  // Not used for Wikia wikis
  "api": "http://tolkiengateway.net/w/api.php",
  // A path to the XML dump file for the wiki
  // Should *not* be the full dump that contains revisions
  // This can be an absolute path, or relative to the CWD of the terminal
  "dump": "/path/to/dump.xml",
  // Optional. Only handle pages within the index range
  // Remember, these are zero-based indexes!
  // Good for resuming, specific updates, or splitting large wikis into parts
  // Note that using `range` will prevent items that exist in the set,
  // but don't have a match in the dump from being deleted from the set
  "range": {
    // Leave out to start at beginning
    "start": 123,
    // Up to, but not including
    // Leave out to go to the end
    "end": 1234
  },
  // Ignore pages and their sections
  "ignore": {
    // Regular expressions
    "pages": [
      "Main Page"
    ],
    // Regular expressions
    "sections": [
      "References",
      "See (A|a)lso"
    ],
    // Normal strings
    // Not used for Wikia wikis
    "htmlElements": [
      "table",
      "aside"
    ]
  },
  // Optional. Find and replace using regular expressions
  "replace": {
    // Find and replace content within a page's HTML before converting to Markdown
    // Not used for Wikia wikis
    "html": [
      ["<a .+>.+</a>", ""]
    ],
    // Find and replace content within a Markdown Document annotation
    "markdown": [
      ["\\[(.+)\\]\\(.+\\)", "$1"]
    ]
  },
  // The namespaces to pull pages from
  // Optional. Remove if you want to accept all namespaces
  "namespaces": [
    0
  ],
  // Optional. Allows you to add searches to created items
  // This is only needed if the wiki does not have a redirect from the alias to
  // the main page title
  // Regex is *not* supported for the page titles or aliases!
  "aliases": {
    // The item created from the page titled `Gandalf` will now have an
    // extra search for `Mithrandir`
    "Gandalf": [
      "Mithrandir"
    ]
  }
}
```

You must provide all of the config keys unless they are marked optional.

## `config`

```
annotate config [--key <key> [--value <value>]]
```

The config command has three different actions based on what options you provide.

- If you ignore all options, this command will output a table with all of the config keys and a (possibly) shortened version of their values.
- If you provide only `key`, the full value for that key will be output to console.
- If you provide `key` _and_ `value` a new value will be set for the key.

Attempting to read or write to a non-existent key will result in an error.

## `convert dictionary`

```bash
annotate convert dictionary --id 123
# or
annotate convert dictionary --file /path/to/file
```

**Note:** You will need [KindleGen](https://www.amazon.com/gp/feature.html?ie=UTF8&docId=1000765211) installed and its binary available to the command line for this to work.

Converts an annotation set into a Kindle dictionary (`.mobi`) file.

### Options

- `compress`: `number` - `0` or missing = none; `1` = standard DOC compression; `2` = Kindle huffdic compression, can take hours for large annotation sets.
- `output`: `string` - An absolute path (including file name) for the output file. If not provided, the output will go to either the current working directory if `id`, or put in the same directory as `file`. Should end with `.mobi`.
- `file`: `string` - Path to the annotation set's JSON file.
- `id`: `number` - ID of the annotation set to download. Requires `xyfirAnnotationsSubscriptionKey`.

# Global Config

- `xyfirAnnotationsAccessKey`: `string`
  - Your Xyfir Annotations access key.
- `xyfirAnnotationsSubscriptionKey`: `string`
  - Your Xyfir Annotations subscription key.

# User Data

annotate-cli stores the config file and other data in `/home/<user>/.xyfir/annotate` in Unix environments and `%APPDATA%\xyfir\annotate` on Windows.
