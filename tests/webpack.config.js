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

  entry: './src/test.jsx',

  output: {
    filename: 'test.js',
    path: path.resolve(__dirname, 'dist')
  },

  resolve: {
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    alias: {
      repo: path.resolve(__dirname, '../')
    },
    extensions: ['.js', '.jsx']
  },

  module: {
    rules: [{
      test: /\.jsx?$/,
      loader: 'babel-loader',
      include: [
        __dirname
      ],
      exclude: /node_modules/,
      options: {
        presets: ['env', 'react']
      }
    }]
  },

  plugins

};