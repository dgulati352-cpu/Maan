/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

if (process.platform === 'win32') {
  const origPromisesMkdir = fs.promises.mkdir;
  fs.promises.mkdir = async function (dir, options) {
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        return await origPromisesMkdir.call(fs.promises, dir, options);
      } catch (err) {
        if (fs.existsSync(dir)) {
          return undefined;
        }
        if ((err?.code === 'EPERM' || err?.code === 'EBUSY' || err?.code === 'EEXIST') && attempt < 19) {
          await new Promise((r) => setTimeout(r, 40 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
  };

  const origMkdirSync = fs.mkdirSync;
  fs.mkdirSync = function (dir, options) {
    try {
      return origMkdirSync.call(fs, dir, options);
    } catch (err) {
      if (fs.existsSync(dir)) {
        return dir;
      }
      throw err;
    }
  };
}
