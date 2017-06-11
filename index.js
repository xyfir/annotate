#!/usr/bin/env node
require('app-module-path').addPath(__dirname);
require('colors');

const commands = require('./commands');
const yargs = require('yargs');

yargs
  .command(
    'generate', 'Generate annotations',
    () => yargs
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
  )
  .command(
    'config', 'Sets or gets config property values', commands.config
  )
  .command(
    'ignore', 'Manipulate ignore list',
    () => yargs
      .command(
        'add', 'Add book id(s) to ignore list',
        commands.addToIgnoreList
      )
      .command(
        'remove', 'Remove book id(s) from ignore list',
        commands.removeFromIgnoreList
      )
      .command(
        'reset', 'Clear ignore list',
        commands.resetIgnoreList
      )
      .command(
        'show', 'Shows contents of list',
        commands.showIgnoreList
      )
  )
  .help('h')
  .alias('h', 'help')
  .argv;