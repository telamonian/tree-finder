/******************************************************************************
 *
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license.  The full license can be found in the LICENSE file.
 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
// To improve build times for large projects enable fork-ts-checker-webpack-plugin
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  "mode": "development",
  "entry": "src/index.ts",
  "output": {
    "path": __dirname+'/dist',
    "filename": "[name].js"
  },
  "watch": false,
  "context": __dirname, // to automatically find tsconfig.json
  "module": {
    "rules": [
      {
        "test": /\.tsx?$/,
        "exclude": /node_modules/,
        "use": {
          "loader": "ts-loader",
          "options": {
            "transpileOnly": false, // Set to true if you are using fork-ts-checker-webpack-plugin
            "projectReferences": true
          }
        }
      },
      {
        test: /\.css$/,
        use: [{loader: "style-loader"}, {loader: "css-loader"}]
      },
    ]
  },
  resolve: {
    modules: [
      "node_modules",
      path.resolve(__dirname)
    ],
    // TsconfigPathsPlugin will automatically add this
    // alias: {
    //   packages: path.resolve(__dirname, 'packages/'),
    // },
    extensions: [".js", ".ts", ".tsx"],
    plugins: [
      new TsconfigPathsPlugin({})
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "simple tree-finder example"
    }),
    // new HtmlWebpackPlugin({
    //   templateContent: `
    //     <html>
    //       <body>
    //         <h1>Project Reference Demo App</h1>
    //         <div id='react-content'></div>
    //       </body>
    //     </html>
    //   `
    // }),
    // new ForkTsCheckerWebpackPlugin()
  ]
}