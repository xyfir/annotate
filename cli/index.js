#!/usr/bin/env node
require('app-module-path').addPath(__dirname);

const command = require('commands/commands');
const yargs = require('yargs');

yargs
  .command('generate', 'Generate annotations from sources', () =>
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
  .command('convert', 'Convert annotations to new formats', () =>
    yargs
      .command(
        'dictionary',
        'Convert annotation set to a dictionary file',
        command('convertDictionary')
      )
      .command(
        'embedded',
        'Convert annotation set to embedded annotations in an ebook',
        command('convertEmbedded')
      )
  )
  .command('config', 'Set/get global config values', command('config'))
  .help('h')
  .alias('h', 'help').argv;
