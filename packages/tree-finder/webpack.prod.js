/*----------------------------------------------------------------------------|
| Copyright (c) 2020, Max Klein
|
| This file is part of the tree-finder library, distributed under the terms of
| the BSD 3 Clause license. The full license can be found in the LICENSE file.
|----------------------------------------------------------------------------*/
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');

// css/style rules
const cssRules = [
  {
    test: /\.css$/i,
    use: [
      // MiniCssExtractPlugin.loader,
      // "style-loader",
      // "@teamsupercell/typings-for-css-modules-loader",
      "css-loader",
    ],
  },
];

module.exports = merge(common, {
  mode: 'production',

  module: {
    rules: [
      ...cssRules,
    ],
  },

  optimization: {
    minimize: true,
  },

  plugins: [
    new MiniCssExtractPlugin(),
  ],
});
