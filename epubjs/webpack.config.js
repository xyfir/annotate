const webpack = require('webpack');
const path = require('path');

const MODE = 'production';

const plugins = MODE == 'production' ? [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production')
    }
  })
] : [];

module.exports = {

  mode: MODE,

  entry: './src/index.js',

  output: {
    libraryTarget: 'umd',
    filename: 'index.js',
    library: 'XyfirAnnotateEPUBJS',
    path: path.resolve(__dirname, 'dist')
  },

  resolve: {
    alias: {
      repo: path.resolve(__dirname, '../')
    },
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    extensions: ['.js']
  },

  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      include: [
        path.resolve(__dirname, 'src/annotations'),
        path.resolve(__dirname, 'src/matches')
      ],
      exclude: /node_modules/,
      options: {
        presets: ['env']
      }
    }]
  },

  plugins

};