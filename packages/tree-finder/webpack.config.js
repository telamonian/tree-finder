/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
const CssnanoPlugin = require('cssnano-webpack-plugin');
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
// const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');

const { dependencySrcMapRules, stylingRules, svgUrlRules } = require("../../webpack.rules");

const treeFinderConfig = {
  entry: {
    'tree-finder': './src/index.ts',
  },

  devtool: 'source-map',

  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',

    // filename: "[name].js",
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
    new MiniCssExtractPlugin(),
    ...(process.env.NODE_ENV === 'production') && [new CssnanoPlugin()],
  ],

  mode: process.env.NODE_ENV === 'production' ? 'production': 'development',

  optimization: {
    minimize: process.env.NODE_ENV === 'production',

    // webpack v5.x only syntax
    // ...(process.env.NODE_ENV === 'production') && {minimizer: ['...', new CssnanoPlugin()]},
  },

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

const themeConfig = {
  entry: {
    'material': './style/theme/material.css',
  },

  devtool: 'source-map',

  output: {
    path: path.resolve(__dirname, 'dist/theme'),
    publicPath: '/dist/',
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
    ...(process.env.NODE_ENV === 'production') && [new CssnanoPlugin()],

    // new RemoveEmptyScriptsPlugin(),
  ],

  mode: process.env.NODE_ENV === 'production' ? 'production': 'development',

  optimization: {
    minimize: process.env.NODE_ENV === 'production',
  },
};

module.exports = [
  treeFinderConfig,
  themeConfig
]
