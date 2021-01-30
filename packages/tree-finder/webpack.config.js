/*----------------------------------------------------------------------------|
| Copyright (c) 2020, Max Klein
|
| This file is part of the tree-finder library, distributed under the terms of
| the BSD 3 Clause license. The full license can be found in the LICENSE file.
|----------------------------------------------------------------------------*/
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
  entry: './src/index.ts',
  devtool: 'source-map',

  output: {
    filename: 'tree-finder.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',

    // use a unique name for each chunk
    // filename: '[name].[chunkhash].js',
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.(jpg|png|gif)$/,
        use: 'file-loader'
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'svg-url-loader',
          options: {encoding: 'none', limit: 10000},
        },
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      ...depSrcMapRules
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  plugins: [
    new MiniCssExtractPlugin(),
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

module.exports = (env, argv) => {

  if (argv.mode === 'development') {
    config.devtool = 'source-map';
    config.optimization.minimize = false;
  }

  return config;
};
