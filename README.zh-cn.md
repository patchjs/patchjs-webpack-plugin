# Patch.js 的 Webpack 插件


## 介绍

这个 webpack 插件用于在构建阶段产生历史版本与当前最新的 Diff 文件。

## 安装

```bash
npm install patchjs-webpack-plugin --save-dev
```

## 如何使用

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

## 配置项

**increment** `Boolean`

**default** `false`

是否开启字符级增量构建。

<br/>

**count** `Number`

**default** `5`

修订号向下自动降级多少个版本。

<br/>

**path** `String`

静态文件 URL 的前缀。

例如: 

URL: `http://static.domain.com/path/to/1.0.0/file.js`

path: `http://static.domain.com/path/to/`

<br/>

**timeout** `Number`

**default** `30000`

请求超时最大时间

## 注意

如果使用 optimize-css-assets-webpack-plugin 插件，必须通过 assetNameRegExp 过滤 diff 文件。

