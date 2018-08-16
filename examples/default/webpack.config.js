var path = require('path');
var fs = require('fs');
var PatchjsWebpackPlugin = require('../../dist/index.js');
var UglifyjsWebpackPlugin = require('uglifyjs-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var nodeEnv = process.env.NODE_ENV;
var pkg = JSON.parse(fs.readFileSync('./package.json'));
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
    chunkFilename: '[name].js',
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' }) }
    ]
  },
  plugins: [
    new PatchjsWebpackPlugin({increment: increment, path: 'http://127.0.0.1:8080/dist/default/'}),
    new UglifyjsWebpackPlugin(),
    new ExtractTextPlugin('[name].css'),
    new webpack.HashedModuleIdsPlugin()
  ]
};
