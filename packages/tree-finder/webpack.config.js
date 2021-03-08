/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const RemoveEmptyScriptsPlugin = require("webpack-remove-empty-scripts");

const { dependencySrcMapRules, stylingRules, svgUrlRules, getOptimization, getResolve, tsRules } = require("../../webpack.rules");

const isProd = process.env.NODE_ENV === "production";

const treeFinderConfig = {
  entry: {
    "tree-finder": "src/index.ts",
  },
  devtool: "source-map",
  context: path.resolve(__dirname, "../.."),

  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/dist/",

    // filename: "[name].js",
    libraryTarget: "umd",

    // use a unique name for each chunk
    // filename: "[name].[chunkhash].js",
  },

  module: {
    rules: [
      ...dependencySrcMapRules,
      ...stylingRules,
      ...svgUrlRules,
      ...tsRules,
    ],
  },

  resolve: {
    ...getResolve(__dirname),
  },

  plugins: [
    new MiniCssExtractPlugin(),
  ],

  mode: isProd ? "production": "development",

  optimization: {
    minimize: isProd,
    ...isProd && getOptimization(),
  },

  // experiments: {
  //   topLevelAwait: true,
  // },

  // don"t include any external packages in bundle
  // externals: [/^[a-z0-9@]/],

  // split the bundle into chunks
  // optimization: {
  //   splitChunks: {
  //     chunks: "all"
  //   }
  // },
};

const themeConfig = {
  entry: {
    "material": "style/theme/material.css",
  },
  devtool: "source-map",
  context: path.resolve(__dirname, "../.."),

  output: {
    path: path.resolve(__dirname, "dist/theme"),
    publicPath: "/dist/",
  },

  module: {
    rules: [
      ...dependencySrcMapRules,
      ...stylingRules,
      ...svgUrlRules,
      ...tsRules,
    ],
  },

  resolve: {
    ...getResolve(__dirname),
  },

  plugins: [
    // new FixStyleOnlyEntriesPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),

    new RemoveEmptyScriptsPlugin(),
  ],

  mode: isProd ? "production": "development",

  optimization: {
    minimize: isProd,
    ...isProd && getOptimization(),
  },
};

module.exports = [
  treeFinderConfig,
  themeConfig
]
