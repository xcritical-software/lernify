

const fs = require('fs-extra');

const findFixture = require('../find-fixture');


module.exports = copyFixture;

function copyFixture(targetDir, fixtureName, cwd) {
  return findFixture(cwd, fixtureName).then((fp) => fs.copy(fp, targetDir));
}
