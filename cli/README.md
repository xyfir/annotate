Formerly known as auto-annotator, **annotate-cli** is a command line tool that allows you to, among other things, automatically generate annotations for an entire library of ebooks via [xyAnnotations](https://annotations.xyfir.com/). This tool is compatible with [Calibre](https://calibre-ebook.com/) and [xyBooks](https://books.xyfir.com/) libraries.

annotate-cli offers a lot more than the basic, common use-case described below. See the [docs](https://github.com/Xyfir/annotate/blob/master/cli/DOCS.md) for more information.

# Install

```bash
npm install -g @xyfir/annotate-cli
```

or you can clone this repo and then:

```bash
cd path/to/annotate/cli
npm install -g
```

# Configuration

Before generating annotations, there's a few things you must do first:

* Generate an access key for your Xyfir Annotations account and save it to annotate-cli's config.
  * Go to Xyfir Annotations [access keys section](https://annotations.xyfir.com/account/access-keys).
  * Generate a new key, and copy that key.
  * Run the following command: `annotate config --key xyfirAnnotationsAccessKey --value "ACCESS_KEY"`. `ACCESS_KEY` should be replaced with the key you copied.
* Save your Calibre ebook library path to config.
  * Find your library directory. This is wherever Calibre stores your books and settings for the library you wish to generate annotations for. The path you're looking for contains a `metadata.db` file and folders with author names.
  * If your library is in Xyfir Books, you will need to download the entire library locally, and then make sure you have Calibre installed.
  * Run the following command: `annotate config --key calibreLibraryPath --value "LIBRARY_PATH"`. `LIBRARY_PATH` should be replaced with the path.
* Save Calibre's binary directory path to config.
  * _You can skip this step if you know that Calibre's binary directory is added to your `PATH`_.
  * Find the path. On Windows, where this setting is most likely needed, it should be located at `C:\Program Files\Calibre2`. Look for files like `calibredb`, `ebook-convert`, etc.
  * Run the following command: `annotate config --key calibreBinPath --value "BIN_PATH"`. `BIN_PATH` should be replaced with the path.

Now, there's more configuration you can do, but this is the bare minimum to get annotate-cli up and running. See [here](https://github.com/Xyfir/annotate/blob/master/cli/DOCS.md) for more configuration options.

# Generating Annotations

```
annotate generate calibre
```

If everything is set properly, this will generate annotations for every book not in the ignore list.
