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
    library: 'XyfirAnnotateEPUBJS',
    path: path.resolve(__dirname, 'dist')
  },

  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js']
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, 'src/annotations'),
          path.resolve(__dirname, 'src/matches')
        ],
        exclude: /node_modules/,
        options: {
          presets: ['@babel/preset-env']
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
