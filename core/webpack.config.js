const webpack = require('webpack');
const path = require('path');

const MODE = 'production';

module.exports = {
  mode: MODE,

  entry: './src/index.js',

  output: {
    libraryTarget: 'umd',
    globalObject: 'this',
    filename: 'index.js',
    library: 'XyfirAnnotateCore',
    path: path.resolve(__dirname, 'dist')
  },

  resolve: {
    alias: {
      repo: path.resolve(__dirname, '../')
    },
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js']
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [path.resolve(__dirname, 'src')],
        exclude: /node_modules/,
        options: {
          presets: ['env']
        }
      }
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(MODE)
      }
    })
  ]
};
