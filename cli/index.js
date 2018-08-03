#!/usr/bin/env node
require('app-module-path').addPath(__dirname);

const command = require('commands/commands');
const yargs = require('yargs');

yargs
  .command('generate', 'Generate annotations', () =>
    yargs
      .command(
        'mediawiki',
        'Generate annotations using a MediaWiki XML dump',
        command('generateMediaWiki')
      )
      .command(
        'calibre',
        'Generate annotations using books from your Calibre library',
        command('generateCalibre')
      )
      .command(
        'libgen',
        'Generate annotations using books from Library Genesis',
        command('generateLibGen')
      )
  )
  .command('convert', 'Convert files', () =>
    yargs.command(
      'dictionary',
      'Convert annotation set to a dictionary file',
      command('convertToDictionary')
    )
  )
  .command('config', 'Sets or gets config property values', command('config'))
  .command('insert', 'Insert annotations into ebooks', () =>
    yargs.command(
      'file',
      'Insert annotations into local epub files',
      command('insert')
    )
  )
  .help('h')
  .alias('h', 'help').argv;
