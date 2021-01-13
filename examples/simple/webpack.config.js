/******************************************************************************
 *
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license.  The full license can be found in the LICENSE file.
 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
// To improve build times for large projects enable fork-ts-checker-webpack-plugin
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

// load dependency source maps
const depSrcMapRules = [
  {
    test: /\.js$/,
    use: 'source-map-loader',
    enforce: 'pre',
    exclude: /node_modules/,
  },
  {test: /\.js.map$/, use: 'file-loader'},
]

let config = {
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  entry: 'src/index.ts',
  output: {
    path: __dirname+'/dist',
    filename: '[name].js'
  },
  watch: false,
  context: __dirname, // to automatically find tsconfig.json
  module: {
    rules: [
      {test: /\.css$/, use: ['style-loader', 'css-loader']},
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: false, // Set to true if you are using fork-ts-checker-webpack-plugin
            projectReferences: true
          }
        }
      },
      ...depSrcMapRules
    ]
  },
  resolve: {
    modules: [
      'node_modules',
      path.resolve(__dirname)
    ],
    extensions: ['.js', '.ts', '.tsx']

    // plugins: [
    //   new TsconfigPathsPlugin({})
    // ],
    //
    // TsconfigPathsPlugin will automatically add this
    // alias: {
    //   packages: path.resolve(__dirname, 'packages/'),
    // }
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'simple tree-finder example'
    })
  ],
  devServer: {
    // contentBase: [path.join(__dirname, "examples"), path.join(__dirname, ".")],
    // inline: false,
    // publicPath: '/dist/',

    // dev-server writes to disk instead of keeping the bundle in memory
    writeToDisk: true,
  },
}

module.exports = (env, argv) => {

  if (argv.mode === 'development') {
    config.devtool = 'source-map';
    config.optimization.minimize = false;
  }

  return config;
};
