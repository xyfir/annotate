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
    library: 'XyfirAnnotateReact',
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
    extensions: ['.js', '.jsx']
  },

  module: {
    rules: [{
      test: /\.jsx?$/,
      loader: 'babel-loader',
      include: [
        path.resolve(__dirname, 'src')
      ],
      exclude: /node_modules/,
      options: {
        presets: ['env', 'react']
      }
    }]
  },

  plugins

};