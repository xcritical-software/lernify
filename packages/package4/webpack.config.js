const { createConfig } = require('../../webpack.config')
const path = require("path");

module.exports = createConfig({
  port: 3003,
  template: path.resolve(__dirname, "index.html"),
  projectPath: __dirname
})