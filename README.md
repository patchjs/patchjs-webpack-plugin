# Patch.js for Webpack


## Introduction

This plug-in is used to calculate the difference between the two files at the build stage.

## Installation

```bash
npm install patchjs-webpack-plugin --save-dev
```

## How to use

```
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
    new PatchjsWebpackPlugin({increment: true})
  ]
};

```

