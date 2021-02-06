/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
// const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

const { dependencySrcMapRules, stylingRules, svgUrlRules } = require("../../webpack.rules");

module.exports = {
  entry: {
    'index' : './src/index.ts',
    'themes': ['./style/theme/material.css'],
  },

  devtool: 'source-map',

  output: {
    // filename: 'tree-finder.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    // libraryTarget: 'umd',

    // use a unique name for each chunk
    // filename: '[name].[chunkhash].js',
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      ...dependencySrcMapRules,
      ...stylingRules,
      ...svgUrlRules,
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  plugins: [
    new FixStyleOnlyEntriesPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    // new RemoveEmptyScriptsPlugin(),
  ],

  // devServer: {
  //   contentBase: [path.join(__dirname, "examples"), path.join(__dirname, ".")],
  //   inline: false,
  //   publicPath: '/dist/',

  //   // dev-server writes to disk instead of keeping the bundle in memory
  //   // writeToDisk: true,
  // },

  // experiments: {
  //   topLevelAwait: true,
  // },

  // don't include any external packages in bundle
  // externals: [/^[a-z0-9@]/],

  // split the bundle into chunks
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all'
  //   }
  // },
};
