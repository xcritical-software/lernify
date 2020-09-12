const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");


module.exports.createConfig = ({ port, template, projectPath }) => {
  const plugins = [
    new CleanWebpackPlugin(),
  ];
  
  if (template) {
    plugins.push(
      new HtmlWebpackPlugin({
        template,
      }),
    )
  }


  return {
  mode: "development",
  entry: path.join(projectPath, "app", "index"),
  // watch: true,
  output: {
    path: path.join(projectPath, "dist"),
    filename: "[hash].bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".json", ".js", ".jsx"],
  },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    inline: true,
    host: "localhost",
    port: port,
  },
  plugins,
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
}
}

