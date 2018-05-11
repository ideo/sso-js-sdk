/* global __dirname, require, module */

const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const path = require('path');
const env = require('yargs').argv.env;

const libraryName = 'IdeoSSO';
const fileName = `ideo-sso-js-sdk${env === 'build' ? '.min' : ''}`;

const plugins = [];

if (env === 'build') {
  plugins.push(new UglifyJsPlugin({minimize: true}));
}

const config = {
  entry: path.join(__dirname, 'src', 'index'),
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: `js/${fileName}.js`,
    library: libraryName,
    libraryTarget: 'var'
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.(js|jsx)$/,
        loader: 'eslint-loader',
        include: [
          path.resolve(__dirname, 'src')
        ]
      },
      {
        test: /\.(js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.json', '.js']
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    watchContentBase: true,
    compress: true,
    port: 9000,
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },
  plugins
};

module.exports = config;
