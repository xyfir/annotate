#!/usr/bin/env node
require('app-module-path').addPath(__dirname);
require('colors');

const commands = require('./commands');
const yargs = require('yargs');

yargs
  .command('generate', 'Generate annotations', () =>
    yargs
      .command(
        'mediawiki',
        'Generate annotations using a MediaWiki XML dump',
        commands.generateMediaWiki
      )
      .command(
        'calibre',
        'Generate annotations using books from your Calibre library',
        commands.generateCalibre
      )
      .command(
        'libgen',
        'Generate annotations using books from Library Genesis',
        commands.generateLibGen
      )
      .command(
        'wikia',
        'Generate annotations using a Wikia.com XML dump. ' +
          'Deprecated: Use `generate mediawiki` instead.',
        commands.generateWikia
      )
  )
  .command('convert', 'Convert files', commands.convert)
  .command('config', 'Sets or gets config property values', commands.config)
  .command('insert', 'Insert annotations into ebooks', () =>
    yargs.command(
      'file',
      'Insert annotations into local epub files',
      commands.insert
    )
  )
  .command('ignore', 'Manipulate ignore list', () =>
    yargs
      .command('add', 'Add books to ignore list', commands.addToIgnoreList)
      .command('show', 'Shows contents of list', commands.showIgnoreList)
      .command('reset', 'Clear ignore list', commands.resetIgnoreList)
      .command(
        'remove',
        'Remove book id(s) from ignore list',
        commands.removeFromIgnoreList
      )
  )
  .help('h')
  .alias('h', 'help').argv;
