# Commands

## generate

> auto-annotator generate [--limit count]

This command loads your Calibre library, loops through the books, and creates annotation sets and annotation set items for each book that shouldn't be ignored. Providing the `--limit` option will tell the generator to stop after a provided number of annotation sets are created from your books.

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

> auto-annotator ignore add --ids 55 # add book id 55 to the ignore list

> auto-annotator ignore add --ids 1,400,2 # add books 1, 400, and 2 to the ignore list

### remove

> auto-annotator ignore remove --ids ids

Removes a single or multiple book IDs from the ignore list.

#### Examples

> auto-annotator ignore remove --ids 55 # remove book 55 from ignore list

> auto-annotator ignore remove --ids 1,400,2 # remove books 1, 400, and 2 from the ignore list

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
- **skipBookIfMatchingSetExists**: *bool*
  - Default: `true`
  - If true, a basic search is done with the full book title and authors. If a set matches that search on Xyfir Annotations, the book is skipped and the set is not created.
- **ignoreBookIfMatchingSetExists**: *bool*
  - Default: `false`
  - Works the same as `skipBookIfMatchingSetExists` except if any sets match the book the book is also added to the ignore list. Takes precedence over `skipBookIfMatchingSetExists`.
- **logGenerationEvents**: *bool*
  - Default: `true`
  - Lets you know what's going on when you run `auto-annotator generate`.
- **xyfirAnnotationsAccessKey**: *string*
  - Your Xyfir Annotations access key.
- **addPrependedSearchAnnotation**: *bool*
  - Default: `true`
  - If true, an extra annotation is added to every annotation set item. The annotation is a web search of the item, prepended with the book title and potentially author name for a more relevant search.