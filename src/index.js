import calcDiffData from 'patchjs-diff';
import {logger, calcDiffFileName, getBuildConfig} from './util';
import urllib from 'urllib';
import co from 'co';
import {parallel} from 'async';
import {Template} from 'webpack';


const defaultOptions = {
  buildConfigPath: 'package.json',
  count: 5,
  increment: false,
  path: '',
  timeout: 30000
};

const pluginName = 'patchjs-webpack-plugin';

function PatchjsWebpackPlugin (options) {
  this.options = Object.assign(defaultOptions, options);
  const buildConfig = getBuildConfig(this.options.buildConfigPath);
  if (!buildConfig) {
    process.exit();
  }

  this.buildConfig = buildConfig;
}

function onRequireExtension (source) {
  const Tpl = Template || this
  // for require.ensure
  const srcMatcher = source.match(/(?<=script\.src\s*\=)[\s\S]*?(?=\n\t)/i); // eslint-disable-line
  if (srcMatcher && srcMatcher.length > 0) {
    // replace dynamic code
    var scriptReg = /\/\/\s+start\s+chunk\s+loading[\s\S]+\(script\);/igm;
    var scriptLoadCode = Tpl.asString([
      `// Script loading by Patch.js`,
      `var src = ${srcMatcher[0]}`,
      `if (window.patchjs) {`,
      Tpl.indent([
        `var timeout = setTimeout(onComplete, 120000);`,
        `function onComplete() {`,
        Tpl.indent([
          `clearTimeout(timeout);`,
          `var chunk = installedChunks[chunkId];`,
          `if(chunk !== 0) {`,
          Tpl.indent([
            `if(chunk) chunk[1](new Error('Loading chunk ' + chunkId + ' failed.'));`,
            `installedChunks[chunkId] = undefined;`
          ]),
          `}`
        ]),
        `};`,
        `window.patchjs.wait().load(src, onComplete);`
      ]),
      `} else {`,
      Tpl.indent([
        `throw new Error('The loader of Patch.js is missing.');`
      ]),
      `}`
    ]);
    // ;
    source = source.replace(scriptReg, scriptLoadCode);
  }

  //for mini-css-extract-plugin
  if (/installedCssChunks/.test(source)) {
    var linkReg = /var\s+linkTag\s+=\s+[\s\S]+\(linkTag\);/igm;
    var cssLoadCode = Tpl.asString([
      `// CSS loading by Patch.js`,
      `if (window.patchjs) {`,
      Tpl.indent([
        `window.patchjs.wait().load(fullhref, function () {`,
        Template.indent([
          `resolve();`
        ]),
        `});`
      ]),
      `} else {`,
      Tpl.indent([
        `throw new Error('The loader of Patch.js is missing.');`
      ]),
      `}`
    ]);
    // ;
    source = source.replace(linkReg, cssLoadCode);
  }
  return source;
}

function onCompilation (compilation, params) {
  compilation.mainTemplate.hooks ? compilation.mainTemplate.hooks.requireExtensions.tap(pluginName, onRequireExtension) : compilation.mainTemplate.plugin("require-extensions", onRequireExtension);
}

function onEmit (compilation, callback) {
  const version = this.buildConfig.version;
  let requestCallback = [];
  for (let fileName in compilation.assets) {
    if (compilation.assets.hasOwnProperty(fileName) && /\.(js|css)$/.test(fileName)) {
      const content = compilation.assets[fileName].source();
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
  compiler.hooks ? compiler.hooks.compilation.tap(pluginName, onCompilation) : compiler.plugin('compilation', onCompilation);
  compiler.hooks ? compiler.hooks.emit.tapAsync(pluginName, onEmit.bind(this)) :  compiler.plugin('emit', onEmit.bind(this));
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
