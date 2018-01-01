auto-annotator is a command line tool that allows you to automatically generate annotations for an entire library of ebooks via [Xyfir Annotations](https://annotations.xyfir.com/). This tool is compatible with [Calibre](https://calibre-ebook.com/) and [Xyfir Books](https://books.xyfir.com/) libraries.

For now, auto-annotator requires you to have Node and npm installed, and have some familiarity with using the command line. In the future, an optional GUI bundled in an installer may exist.

# Install

> npm install -g auto-annotator

or you can clone this repo and then:

> cd path/to/auto-annotator

> npm install -g

# Configuration

Before generating annotations, there's a few things you must do first:

- Generate an access key for your Xyfir Annotations account and save it to auto-annotator's config.
  - Go to Xyfir Annotations' [access keys section](https://annotations.xyfir.com/#/account/access-keys).
  - Generate a new key, and copy that key.
  - Run the following command: `auto-annotator config --key xyfirAnnotationsAccessKey --value "ACCESS_KEY"`. `ACCESS_KEY` should be replaced with the key you copied.
- Save your Calibre ebook library path to config.
  - Find your library directory. This is wherever Calibre stores your books and settings for the library you wish to generate annotations for. The path you're looking for contains a `metadata.db` file and folders with author names.
  - If your library is in Xyfir Books, you will need to download the entire library locally, and then make sure you have Calibre installed.
  - Run the following command: `auto-annotator config --key calibreLibraryPath --value "LIBRARY_PATH"`. `LIBRARY_PATH` should be replaced with the path.
- Save Calibre's binary directory path to config.
  - *You can skip this step if you know that Calibre's binary directory is added to your `PATH`*.
  - Find the path. On Windows, where this setting is most likely needed, it should be located at `C:\Program Files\Calibre2`. Look for files like `calibredb`, `ebook-convert`, etc.
  - Run the following command: `auto-annotator config --key calibreBinPath --value "BIN_PATH"`. `BIN_PATH` should be replaced with the path.

Now, there's more configuration you can do, but this is the bare minimum to get auto-annotator up and running. See [here](https://github.com/Xyfir/auto-annotator/blob/master/DOCS.md) for more configuration options.

# Generating Annotations

> auto-annotator generate calibre

If everything is set properly, this will generate annotations for every book not in the ignore list. See [here](https://github.com/Xyfir/auto-annotator/blob/master/DOCS.md) for more information.