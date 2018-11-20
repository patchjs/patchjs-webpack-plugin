# Patch.js for Webpack


## Introduction

This plug-in is used to calculate the difference between the two files at the build stage.

## Installation

```bash
npm install patchjs-webpack-plugin --save-dev
```

## How to use

```js
var path = require('path');
var PatchjsWebpackPlugin = require('patchjs-webpack-plugin');

module.exports = {
  entry: {
    example: './example.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' }
    ]
  },
  plugins: [
    new PatchjsWebpackPlugin({increment: true, path: 'http://static.domain.com/path/to/'})
  ]
};

```

## Options

**increment** `Boolean`

**default** `false`

It enables the incremental build.

<br/>

**count** `Number`

**default** `5`

how many incremental versions are build.

<br/>

**path** `String`

the URL prefix of a static file, recommended to use the production environment URL.

eg: 

URL: `http://static.domain.com/path/to/1.0.0/file.js`

path : `http://static.domain.com/path/to/`

<br/>

**timeout** `Number`

**default** `30000ms`

request timeout value.

<br/>

**validateVersion** `Boolean`

**default** `false`

check whether the current version is deployed.


## Others 

if you used optimize-css-assets-webpack-plugin，please filter diff file by assetNameRegExp.









