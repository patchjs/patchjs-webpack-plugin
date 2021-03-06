var path = require('path');
var PatchjsWebpackPlugin = require('../../dist/index.js');
var UglifyjsWebpackPlugin = require('uglifyjs-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var fs = require('fs');
var pkg = JSON.parse(fs.readFileSync('./package.json'));
var nodeEnv = process.env.NODE_ENV;
var webpack = require('webpack');

var increment = true;
if (nodeEnv === 'dev') {
  increment = false;
}

module.exports = {
  entry: {
    example: './example.js',
    example1: './example1.js'
  },
  output: {
    path: path.join(__dirname, 'dist/' + pkg.name + '/' + pkg.version),
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader') }
    ]
  },
  plugins: [
    new UglifyjsWebpackPlugin(),
    new webpack.optimize.CommonsChunkPlugin('common.js'),
    new ExtractTextPlugin('[name].css'),
    new PatchjsWebpackPlugin({increment: increment, path: 'http://127.0.0.1:8080/dist/webpack1.x/'})
  ]
};
