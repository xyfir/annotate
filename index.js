#!/usr/bin/env node
require('colors');
const commands = require('./commands');
const yargs = require('yargs');

yargs
  .command(
    'generate', 'Generate annotations', commands.generate
  )
  .command(
    'config', 'Set config property value', commands.config
  )
  .command('ignore', 'Manipulate ignore list', () => {
    return yargs
      .command(
        'add', 'Add book id to ignore list',
        commands.addToIgnoreList
      )
      .command(
        'remove', 'Remove book id from ignore list',
        commands.removeFromIgnoreList
      )
      .command(
        'reset', 'Clear ignore list',
        commands.resetIgnoreList
      )
      .command(
        'show', 'Shows contents of list',
        commands.showIgnoreList
      );
  })
  .demand(1, 'You must provide a valid command')
  .help('h')
  .alias('h', 'help')
  .argv;