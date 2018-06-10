# Commands

## `insert file`

```
annotate insert file --file /path/to/file.epub --set 1234
```

Creates a copy of the epub file and inserts links to view annotations for matches of searches within items in the provided annotation set. This should allow you to view annotations from within any ebook reader that supports epub, regardless of whether that reader supports xyAnnotations.

**Note**: A xyAnnotations subscription and the `xyfirAnnotationsSubscriptionKey` config key are required. If you don't have a subscription, try out [xyBooks](https://books.xyfir.com/). New users receive a free month subscription. You can find your key in the _Reader Settings_ section.

### Options

- `--set: number` - The id of the annotation set to insert into the ebook.
- `--file: string` - Path to an epub file. A modified copy will be created next to this file.
- `--convert: boolean` - _optional_ - Attempts to convert the original source file to EPUB prior to inserting annotations into it. **Note:** You will need Calibre installed and its binaries available to the command line for this to work.
- `--delete-source: boolean` - _optional_ - Deletes the source file on success. If `--convert` is provided it also deletes the converted file.

## `generate calibre`

```
annotate generate calibre
```

This command loads your Calibre library, loops through the books, and creates annotation sets and annotation set items for each book that shouldn't be ignored.

**Note:** You will need Calibre installed and its binaries available to the command line for this to work.

### Options

- `--limit: number` - Stop after the specified number of annotation sets are created. Ignored or skipped books do not count.
- `--ids: number|string` - Ignore all books other than those with the ids provided. Can be a single id or a list of ids (`1,55,100`).
- `--start-at: number` - Skip all books before the book with the provided id. Defaults to `0`.
- `--stop-at: number` - Stop generating after the book with the provided id. You should provide this value if possible to prevent annotate-cli from quitting if it assumes that it has reached the end of the library. Defaults to `99999999`, and may quit before.

## `generate libgen`

```
annotate generate libgen
```

This command can most likely be ignored. It is used by the AutoAnnotator bot account on xyAnnotations.

This command requires a local copy of the Library Genesis database (libgen_YYYY-MM-DD.rar) taken from [LibGen's database dumps](http://gen.lib.rus.ec/dbdumps/)). Only the `updated_edited` table is used. It pulls the needed metadata for books from the LibGen database, downloads a temporary copy of the ebook (directly from LibGen's actual server), generates annotations with that book, and then deletes the book.

### Options

- `--limit: number` - Stop after the specified number of books are pulled from the database. Unlike the `generate calibre` command, books that were skipped are counted towards the limit.

### Notes

- Calibre still needs to be installed because Calibre's `ebook-convert` is used.
- This command will not interfere with or use your Calibre library.
- This command uses both the `ignoreBookIfMatchExists` and `skipBookIfMatchExists` config properties. Both are treated the same (as skip), since books from LibGen are not added to a Calibre library and are not added to the ignore list.

## `generate mediawiki`

```
annotate generate mediawiki --config /path/to/config.json
```

Creates, updates, and deletes items in the specified annotation set using the pages in a MediaWiki dump file.

For Wikia, dumps can be found at [http://community.wikia.com/wiki/Special:Statistics](http://community.wikia.com/wiki/Special:Statistics) where `community` is replaced with the name of the Wikia site you wish to download data from.

If the wiki does not have public dumps available for download, you can use the [wikiteam](https://github.com/WikiTeam/wikiteam) tools.

### Options

This command takes a single option, `--config: string`, that is a path to a JSON file that contains the actual options for the command. The contents of that JSON file will look something like:

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
  ]
}
```

You must provide all of the config keys unless they are marked optional.

## `config`

```
annotate config [--key keyName [--value keyValue]]
```

The config command has three different actions based on what options you provide.

- If you ignore all options, this command will output a table with all of the config keys and a (possibly) shortened version of their values.
- If you provide only `--key`, the full value for that key will be output to console.
- If you provide `--key` _and_ `--value` a new value will be set for the key.

Attempting to read or write to a non-existent key will result in an error.

## Ignore Commands

The `ignore` command has multiple sub-commands that allow you to work with annotate-cli's ignore list. The ignore list is a list of your Calibre library's book IDs that annotate-cli will skip annotation generation for. The IDs have either been added to the ignore list via `annotate ignore add` or automatically because an annotation set was created for that book.

The ignore list is global, and not specific to a certain library. If you change your library path or replace the library at the same location with another, you should run `annotate ignore reset` so that you're not unknowingly ignoring books that you shouldn't be.

### `ignore add`

```
annotate ignore add --ids ids
```

Adds a single or multiple book IDs to the ignore list.

#### Examples

Add book id 55 to the ignore list

```
annotate ignore add --ids 55
```

Add books 1, 400, and 2 to the ignore list

```
annotate ignore add --ids 1,400,2
```

### `ignore remove`

```
annotate ignore remove --ids ids
```

Removes a single or multiple book IDs from the ignore list.

#### Examples

Remove book 55 from ignore list

```
annotate ignore remove --ids 55
```

Remove books 1, 400, and 2 from the ignore list

```
annotate ignore remove --ids 1,400,2
```

### `ignore reset`

```
annotate ignore reset
```

Removes all IDs from the ignore list.

### `ignore show`

```
annotate ignore show
```

Outputs all IDs in the ignore list. The `--multiline` option puts each ID on its own line. The `--sort` option sorts all of the ids in ascending order.

# Config Keys

- **calibreBinPath**: _string_
  - The path to Calibre's binaries.
  - Can be left empty if this path is in your system's PATH.
- **calibreLibraryPath**: _string_
  - The path to the Calibre library you wish to generate annotations for.
  - Should contain a metadata.db file and folders for each author.
- **deleteGeneratedFormat**: _bool_
  - Default: `true`
  - Xyfir Annotations generates annotations from a text file. If a book does not have a text format, one is generated from the first format available. If this is true, that generated file is deleted after it is used.
- **addGeneratedFormat**: _bool_
  - Default: `false`
  - If true, the generated text file is added to the book as another format.
  - If true, deleteGeneratedFormat is ignored.
- **skipBookIfMatchExists**: _bool_
  - Default: `true`
  - If true, a basic search is done with the full book title and authors. If a book matches that search on xyAnnotations, the book is skipped and nothing is created on xyAnnotations for that book or its content.
- **ignoreBookIfMatchExists**: _bool_
  - Default: `false`
  - Works the same as `skipBookIfMatchExists` except if any books match on xyAnnotations match the local book, the book is also added to the ignore list. Takes precedence over `skipBookIfMatchExists`.
- **logGenerationEvents**: _bool_
  - Default: `true`
  - Lets you know what's going on when you run one of the `generate` commands.
- **xyfirAnnotationsAccessKey**: _string_
  - Your Xyfir Annotations access key.
- **xyfirAnnotationsSubscriptionKey**: _string_
  - Your Xyfir Annotations subscription key.

## Library Genesis

- **libgenDatabaseName**: _string_
  - Default: `"libgen"`
  - The name of the local LibGen database.
- **libgenDatabaseHost**: _string_
  - Default `"localhost"`
  - The host for the local LibGen database.
- **libgenDatabaseUser**: _string_
  - Default `"root"`
  - Username for the local LibGen database.
- **libgenDatabasePass**:
  - Password for the local LibGen database.
- **libgenLastId**: _number_
  - Default `0`
  - The id of the last book in the LibGen database that was handled in the `generate libgen` command.
  - Will be updated on its own should be left alone unless you want the command to start at a specific location.

# User Data

annotate-cli stores the config file and other data in `/home/<user>/.xyfir/annotate` in Unix environments and `%APPDATA%\xyfir\annotate` on Windows.
