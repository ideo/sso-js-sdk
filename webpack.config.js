/* global __dirname, require, module */

const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const path = require('path');
const env = require('yargs').argv.env;

const libraryName = 'IdeoSSO';
const fileName = `ideo-sso-js-sdk${env === 'build' ? '.min' : ''}`;

const plugins = [
  new ExtractTextPlugin(`css/${fileName}.css`)
];

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
        exclude: /node_modules/
      },
      {
        test: /\.(js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /\.(css|scss)$/,
        exclude: /node_modules/,
        loaders: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {loader: 'css-loader?minimize&url=false'},
            {
              loader: 'sass-loader',
              options: {
                includePaths: ['node_modules/']
              }
            },
            {loader: 'postcss-loader'}
          ]
        })
      }
    ]
  },
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.json', '.js']
  },
  plugins
};

module.exports = config;
