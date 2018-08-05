const { spawn } = require('child_process');

/**
 * Run KindleGen.
 * @async
 * @param {string} file
 * @param {number} [compress]
 */
module.exports = (file, compress) =>
  new Promise(resolve => {
    const kg = spawn('kindlegen', [
      file,
      `-c${+compress || 0}`,
      '-verbose',
      '-dont_append_source'
    ]);

    kg.stderr.on('data', d => console.error(`[e][kindlegen]`, d.toString()));
    kg.stdout.on('data', d => console.log(`[i][kindlegen]`, d.toString()));
    kg.on('close', code => {
      if (code == 0) {
        console.log('KindleGen completed without error');
        resolve();
      } else {
        console.warn('KindleGen errored or completed with warnings');
        resolve();
      }
    });
  });
