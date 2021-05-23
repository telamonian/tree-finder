/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
const path = require("path");

const { dependencySrcMapRules, getOptimization, getContext, getResolve, tsRules } = require("../../webpack.rules");

const isProd = process.env.NODE_ENV === "production";

const treeFinderMockcontentsConfig = {
  entry: {
    "tree-finder-mockcontents": "src/index.ts",
  },
  devtool: "source-map",
  ...getContext(__dirname),

  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/dist/",
    libraryTarget: "umd",
  },

  module: {
    rules: [
      ...dependencySrcMapRules,
      ...tsRules,
    ],
  },

  resolve: {
    ...getResolve(__dirname),
  },

  mode: isProd ? "production": "development",

  optimization: {
    minimize: isProd,
    ...isProd && getOptimization(),
  },
};

module.exports = [
  treeFinderMockcontentsConfig,
]
