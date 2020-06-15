const path = require('path');

// load dependency source maps
const depSrcMapRules = [
  {
    test: /\.js$/,
    use: 'source-map-loader',
    enforce: 'pre',
    // exclude: /node_modules/,
  },
  {test: /\.js.map$/, use: 'file-loader'},
]

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/index.ts',
  devtool: 'source-map',
  module: {
    rules: [
      {test: /\.css$/, use: ['style-loader', 'css-loader']},
      {test: /\.(jpg|png|gif)$/, use: 'file-loader'},
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
  output: {
    filename: 'regular-tree.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',

    // use a unique name for each chunk
    // filename: '[name].[chunkhash].js',
  },
  devServer: {
    contentBase: [path.join(__dirname, '.')],
    inline: false,
    publicPath: '/dist/',

    // dev-server writes to disk instead of keeping the bundle in memory
    // writeToDisk: true,
  },
  experiments: {
    topLevelAwait: true,
  },

  // don't include any external packages in bundle
  // externals: [/^[a-z0-9@]/],

  // split the bundle into chunks
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all'
  //   }
  // },
};
