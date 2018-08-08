import calcDiffData from 'patchjs-diff';
import {logger, calcDiffFileName, getBuildConfig} from './util';
import urllib from 'urllib';
import co from 'co';
import {parallel} from 'async';
import {codeTpl} from './tpl'

const defaultOptions = {
  buildConfigPath: 'package.json',
  count: 5,
  increment: false,
  path: '',
  timeout: 30000
};

function PatchjsWebpackPlugin (options) {
  options = options || defaultOptions;
  if (options !== defaultOptions) {
    for (let p in defaultOptions) {
      if (!options.hasOwnProperty(p)) {
        options[p] = defaultOptions[p];
      }
    }
  }
  const buildConfig = getBuildConfig(options.buildConfigPath);
  if (!buildConfig) {
    process.exit();
  }

  this.buildConfig = buildConfig;
  this.options = options;
}

function onRequireExtension (source) {
  // extract src
  const srcMatcher = source.match(/(?<=script\.src\s*\=)[\s\S]*?(?=\n\t)/i);
  if (srcMatcher && srcMatcher.length > 0) {
    // replace dynamic code
    var reg = /var\s+head\s+\=[\s\S]+\(script\);/igm;
    var dynamicLoadCode = `var src = ${srcMatcher[0]}\n\t` + codeTpl;
    source = source.replace(reg, dynamicLoadCode);
  }
  return source;
}

function onCompilation (compilation, params) {
  compilation.mainTemplate.hooks ? compilation.mainTemplate.hooks.requireExtensions.tap('PatchjsWebpackPlugin', onRequireExtension) : compilation.mainTemplate.plugin("require-extensions", onRequireExtension);
}

function onEmit (compilation, callback) {
  const version = this.buildConfig.version;
  let requestCallback = [];
  for (let fileName in compilation.assets) {
    if (compilation.assets.hasOwnProperty(fileName) && /\.(js|css)$/.test(fileName)) {
      const content = this.getAssetContent(compilation.assets[fileName]);
      if (content) {
        // calculate diff file path.
        const diffFilePathArray = calcDiffFileName(fileName, this.options.path, version, this.options.count);
        // start build diff js.
        for (let i = 0, len = diffFilePathArray.length; i < len; i++) {
          requestCallback.push((response) => {
            this.buildDiffFile(diffFilePathArray[i], content, (result) => {
              try {
                response(null, result);
              } catch (e) {}
            });
          });
        }
      }
    }
  }
  parallel(requestCallback, (err, results) => {
    if (!err) {
      for (let i = 0, len = results.length; i < len; i++) {
        const item = results[i];
        if (item && !item.errCode) {
          compilation.assets[item.diffFileName] = {
            source: () => {
              return item.source;
            },
            size: () => {
              return Buffer.byteLength(item.source, 'utf8');
            }
          };
        } else {
          logger.err(item.msg);
          if (item.errCode === 'reqerror') {
            process.exit(1);
          }
        }
      }
      callback();
    }
  });
}

PatchjsWebpackPlugin.prototype.apply = function (compiler) {
  if (!this.options.increment) {
    return;
  }
  compiler.hooks ? compiler.hooks.compilation.tap('PatchjsWebpackPlugin', onCompilation) : compiler.plugin('compilation', onCompilation);
  compiler.hooks ? compiler.hooks.emit.tapAsync('PatchjsWebpackPlugin', onEmit.bind(this)) :  compiler.plugin('emit', onEmit.bind(this));
};

PatchjsWebpackPlugin.prototype.getAssetContent = function (asset) {
  let content = '';
  if (asset._value) {
    content = asset._value;
  } else if (asset.children) {
    asset.children.forEach(function (item) {
      if (item._value) {
        content += item._value;
      } else {
        content += item;
      }
    });
  } else if (asset._cachedSource) {
    content = asset._cachedSource;
  } else if (asset._source) {
    if (asset._source.children && asset._source.children.length > 0) {
      asset._source.children.forEach(function (item) {
        if (item._value) {
          content += item._value;
        }
      });
    }
  }
  return content;
};

// diff build js
PatchjsWebpackPlugin.prototype.buildDiffFile = function (diffFileItem, content, callback) {
  const timeout = this.options.timeout;
  co(function * () { // es6 co
    const result = yield urllib.requestThunk(diffFileItem.localFileUrl, {timeout: timeout});
    const localFileContent = result.data.toString();
    if (result.status === 200) {
      const result = calcDiffData(localFileContent, content);
      let diffResult = {
        diffFileName: diffFileItem.diffFileName,
        source: JSON.stringify(result)
      };
      callback(diffResult);
    } else {
      const msg = `Not Found: ${diffFileItem.localFileUrl}`;
      let result = {
        errCode: 'reserror',
        msg: msg
      };
      callback(result);
    }
  }).catch((e) => {
    let result = {
      errCode: 'reqerror',
      msg: e
    };
    callback(result);
  });
};

module.exports = PatchjsWebpackPlugin;
