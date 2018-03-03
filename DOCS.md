# Commands

## generate calibre

> auto-annotator generate calibre

This command loads your Calibre library, loops through the books, and creates annotation sets and annotation set items for each book that shouldn't be ignored.

### Options

- `--limit: number` - Stop after the specified number of annotation sets are created. Ignored or skipped books do not count.
- `--ids: number|string` - Ignore all books other than those with the ids provided. Can be a single id or a list of ids (`1,55,100`).
- `--start-at: number` - Skip all books before the book with the provided id. Defaults to `0`.
- `--stop-at: number` - Stop generating after the book with the provided id. You should provide this value if possible to prevent auto-annotator from quitting if it assumes that it has reached the end of the library. Defaults to `99999999`, and may quit before.

## generate libgen

> auto-annotator generate libgen

This command can most likely be ignored. It is used by the AutoAnnotator bot account on xyAnnotations.

This command requires a local copy of the Library Genesis database (libgen_YYYY-MM-DD.rar) taken from [LibGen's database dumps](http://gen.lib.rus.ec/dbdumps/)). Only the `updated_edited` table is used. It pulls the needed metadata for books from the LibGen database, downloads a temporary copy of the ebook (directly from LibGen's actual server), generates annotations with that book, and then deletes the book.

### Options

- `--limit: number` - Stop after the specified number of books are pulled from the database. Unlike the `generate calibre` command, books that were skipped are counted towards the limit.

### Notes

- Calibre still needs to be installed because Calibre's `ebook-convert` is used.
- This command will not interfere with or use your Calibre library.
- This command uses both the `ignoreBookIfMatchExists` and `skipBookIfMatchExists` config properties. Both are treated the same (as skip), since books from LibGen are not added to a Calibre library and are not added to the ignore list.

## config

> auto-annotator config [--key keyName [--value keyValue]]

The config command has three different actions based on what options you provide.

- If you ignore all options, this command will output a table with all of the config keys and a (possibly) shortened version of their values.
- If you provide only `--key`, the full value for that key will be output to console.
- If you provide `--key` *and* `--value` a new value will be set for the key.

Attempting to read or write to a non-existent key will result in an error.

## ignore

The ignore command has multiple sub-commands that allow you to work with auto-annotator's ignore list. The ignore list is a list of your Calibre library's book IDs that auto-annotator will skip annotation generation for. The IDs have either been added to the ignore list via `auto-annotator ignore add` or automatically because an annotation set was created for that book.

The ignore list is global, and not specific to a certain library. If you change your library path or replace the library at the same location with another, you should run `auto-annotator ignore reset` so that you're not unknowingly ignoring books that you shouldn't be.

### add

> auto-annotator ignore add --ids ids

Adds a single or multiple book IDs to the ignore list.

#### Examples

Add book id 55 to the ignore list
> auto-annotator ignore add --ids 55

Add books 1, 400, and 2 to the ignore list
> auto-annotator ignore add --ids 1,400,2

### remove

> auto-annotator ignore remove --ids ids

Removes a single or multiple book IDs from the ignore list.

#### Examples

Remove book 55 from ignore list
> auto-annotator ignore remove --ids 55

Remove books 1, 400, and 2 from the ignore list
> auto-annotator ignore remove --ids 1,400,2

### reset

> auto-annotator ignore reset

Removes all IDs from the ignore list.

### show

> auto-annotator ignore show

Outputs all IDs in the ignore list. The `--multiline` option puts each ID on its own line. The `--sort` option sorts all of the ids in ascending order.

# Config Keys

- **calibreBinPath**: *string*
  - The path to Calibre's binaries.
  - Can be left empty if this path is in your system's PATH.
- **calibreLibraryPath**: *string*
  - The path to the Calibre library you wish to generate annotations for.
  - Should contain a metadata.db file and folders for each author.
- **deleteGeneratedFormat**: *bool*
  - Default: `true`
  - Xyfir Annotations generates annotations from a text file. If a book does not have a text format, one is generated from the first format available. If this is true, that generated file is deleted after it is used.
- **addGeneratedFormat**: *bool*
  - Default: `false`
  - If true, the generated text file is added to the book as another format.
  - If true, deleteGeneratedFormat is ignored.
- **annotationSetTitle**: *string*
  - Default: `"Generated Annotations"`
  - The title for annotation sets.
- **annotationSetDescription**: *string*
  - Default: `"Automatically generated 'Web Search' annotations; mostly proper nouns (characters, locations, etc).\n\nAnnotations are generated with Xyfir Annotations' item generator and [auto-annotator](https://github.com/Xyfir/auto-annotator)."`
  - The description for annotation sets.
- **skipBookIfMatchExists**: *bool*
  - Default: `true`
  - If true, a basic search is done with the full book title and authors. If a book matches that search on xyAnnotations, the book is skipped and nothing is created on xyAnnotations for that book or its content.
- **ignoreBookIfMatchExists**: *bool*
  - Default: `false`
  - Works the same as `skipBookIfMatchExists` except if any books match on xyAnnotations match the local book, the book is also added to the ignore list. Takes precedence over `skipBookIfMatchExists`.
- **logGenerationEvents**: *bool*
  - Default: `true`
  - Lets you know what's going on when you run one of the `generate` commands.
- **xyfirAnnotationsAccessKey**: *string*
  - Your Xyfir Annotations access key.
- **addSearchAnnotationContext**: *bool*
  - Default: `true`
  - If true, extra context is added to every 'Web Search' annotation that is generated. The context is all or a portion of the book title and potentially the author's name for a more relevant search. See xyAnnotations' user help docs for more on 'Contextual Search Annotations'.

## Library Genesis

- **libgenDatabaseName**: *string*
  - Default: `"libgen"`
  - The name of the local LibGen database.
- **libgenDatabaseHost**: *string*
  - Default `"localhost"`
  - The host for the local LibGen database.
- **libgenDatabaseUser**: *string*
  - Default `"root"`
  - Username for the local LibGen database.
- **libgenDatabasePass**:
  - Password for the local LibGen database.
- **libgenLastId**: *number*
  - Default `0`
  - The id of the last book in the LibGen database that was handled in the `generate libgen` command.
  - Will be updated on its own should be left alone unless you want the command to start at a specific location.

# User Data

auto-annotator stores the config file and ignore list in `/home/<user>/.auto-annotator` in Unix environments and `%APPDATA%\auto-annotator` on Windows.