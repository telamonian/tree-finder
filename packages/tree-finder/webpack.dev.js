/*----------------------------------------------------------------------------|
| Copyright (c) 2020, Max Klein
|
| This file is part of the tree-finder library, distributed under the terms of
| the BSD 3 Clause license. The full license can be found in the LICENSE file.
|----------------------------------------------------------------------------*/
const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');

// css/style rules
const cssRules = [
  {
    test: /\.css$/i,
    use: [
      // "style-loader",
      // "@teamsupercell/typings-for-css-modules-loader",
      // {
      //   loader: "@teamsupercell/typings-for-css-modules-loader",
      //   options: {
      //     verifyOnly: true,
      //   }
      // },
      "css-loader",
    ],
  },
];

module.exports = merge(common, {
  mode: 'development',

  module: {
    rules: [
      ...cssRules,
    ],
  },

  optimization: {
    minimize: false,
  },
});
