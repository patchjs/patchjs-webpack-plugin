import calcDiffData from 'patchjs-diff';
import {logger, calcDiffFileName, getPkgConfig} from './util';
import urllib from 'urllib';
import co from 'co';
import {parallel} from 'async';
import {Template} from 'webpack';


const defaultOptions = {
  pkgPath: 'package.json',
  count: 5,
  increment: false,
  path: '',
  timeout: 30000,
  validateVersion: false
};

const pluginName = 'patchjs-webpack-plugin';

function PatchjsWebpackPlugin (options) {
  this.options = Object.assign(defaultOptions, options);
  const pkgConfig = getPkgConfig(this.options.pkgPath);
  if (!pkgConfig) {
    logger.err('the file of package.json is missing.');
    process.exit(1);
  }

  this.pkgConfig = pkgConfig;
}

function onRequireExtension (source) {
  const Tpl = Template || this;
  // for require.ensure
  const srcMatcher = source.match(/(?<=script\.src\s*\=)[\s\S]*?(?=\n\t)/i); // eslint-disable-line
  if (srcMatcher && srcMatcher.length > 0) {
    // replace dynamic code
    var scriptReg = /\/\/\s+start\s+chunk\s+loading[\s\S]+\(script\);/igm;
    var scriptLoadCode = Tpl.asString([
      '// Script loading by Patch.js',
      `var __src__ = ${srcMatcher[0]}`,
      'if (window.patchjs) {',
      Tpl.indent([
        'var timeout = setTimeout(onComplete, 120000);',
        'function onComplete() {',
        Tpl.indent([
          'clearTimeout(timeout);',
          'var chunk = installedChunks[chunkId];',
          'if(chunk !== 0) {',
          Tpl.indent([
            'if(chunk) chunk[1](new Error("Loading chunk " + chunkId + " failed."));',
            'installedChunks[chunkId] = undefined;'
          ]),
          '}'
        ]),
        '};',
        'window.patchjs.wait().load(__generateURL__(__src__), onComplete);'
      ]),
      '} else {',
      Tpl.indent([
        'throw new Error("The loader of Patch.js is missing.");'
      ]),
      '}'
    ]);
    // ;
    source = source.replace(scriptReg, scriptLoadCode);
  }

  //for mini-css-extract-plugin
  if (/installedCssChunks/.test(source)) {
    var linkReg = /var\s+linkTag\s+=\s+[\s\S]+\(linkTag\);/igm;
    var cssLoadCode = Tpl.asString([
      '// CSS loading by Patch.js',
      'if (window.patchjs) {',
      Tpl.indent([
        'window.patchjs.wait().load(__generateURL__(fullhref), function () {',
        Tpl.indent([
          'resolve();'
        ]),
        '});'
      ]),
      '} else {',
      Tpl.indent([
        'throw new Error("The loader of Patch.js is missing.");'
      ]),
      '}'
    ]);
    // ;
    source = source.replace(linkReg, cssLoadCode);
  }
  return source;
}

function onLocalVars (source, chunk) {
  const Tpl = Template || this;
  let hasDynamicEntry = false;

  if (chunk.groupsIterable) {
    for (const chunkGroup of chunk.groupsIterable) {
      if (chunkGroup.getNumberOfChildren() > 0) hasDynamicEntry = true;
    }
  } else {
    if (chunk.chunks) {
      if (chunk.chunks.length > 0) hasDynamicEntry = true;
    }
  }

  if (hasDynamicEntry) {
    return Tpl.asString([
      source,
      '// for Patch.js generate path',
      'function __generateURL__ (src) {',
      Tpl.indent([
        'var patchjsPath = window.patchjs.options.path + window.patchjs.options.version + "/";',
        'if (patchjsPath && src) {',
        Tpl.indent([
          'for (var len = src.length; len > 0; len--) {',
          Tpl.indent([
            'var subSrc = src.substr(0, len);',
            'var index = patchjsPath.lastIndexOf(subSrc);',
            'if (index !== -1 && index === patchjsPath.length - subSrc.length) {',
            Tpl.indent([
              'return src.substring(len);'
            ]),
            '}'
          ]),
          '}',
          'return src;'
        ]),
        '} else {',
        Tpl.indent([
          'throw new Error("Error URL.");'
        ]),
        '}'
      ]),
      '}'
    ]);
  } 
  return source;
}

function onCompilation (compilation, params) {
  compilation.mainTemplate.hooks ? compilation.mainTemplate.hooks.requireExtensions.tap(pluginName, onRequireExtension) : compilation.mainTemplate.plugin("require-extensions", onRequireExtension);
  compilation.mainTemplate.hooks ? compilation.mainTemplate.hooks.localVars.tap(pluginName, onLocalVars) : compilation.mainTemplate.plugin("local-vars", onLocalVars);
}

function onEmit (compilation, callback) {
  const version = this.pkgConfig.version;
  const requestCallback = [];
  const validateCallback = [];
  let isRequestCompleted = false;
  let isValidateCompleted = false;

  for (let fileName in compilation.assets) {
    if (compilation.assets.hasOwnProperty(fileName) && /\.(js|css)$/.test(fileName)) {
      if (this.options.validateVersion) {
        const reqUrl = `${this.options.path}${version}/${fileName}`;
        validateCallback.push((response) => {
          this.validateVersion(reqUrl, (isValid) => {
            try {
              response(null, isValid);
            } catch (e) {}
          });
        });
      }
      
      if (this.options.increment) {
        const content = compilation.assets[fileName].source();
        if (content) {
          // calculate diff file name.
          const diffFileNameArray = calcDiffFileName(fileName, this.options.path, version, this.options.count);
          // start build diff js.
          for (let i = 0, len = diffFileNameArray.length; i < len; i++) {
            requestCallback.push((response) => {
              this.buildDiffFile(diffFileNameArray[i], content, (result) => {
                try {
                  response(null, result);
                } catch (e) {}
              });
            });
          }
        }
      }
    }
  }

  if (validateCallback.length > 0) {
    parallel(validateCallback, (err, results) => {
      isValidateCompleted = true;
      if (!err) {
        for (let i = 0, len = results.length; i < len; i++) {
          if (!results[i]) {
            logger.err(`Deployed Version: ${version}`);
            process.exit(1);
            return;
          }
        }
      }
      if (isRequestCompleted || requestCallback.length === 0) {
        callback();
      }
    })
  }

  parallel(requestCallback, (err, results) => {
    isRequestCompleted = true;

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
    }

    if (isValidateCompleted || validateCallback.length === 0) {
      callback();
    }
  });
}

PatchjsWebpackPlugin.prototype.apply = function (compiler) {
  compiler.hooks ? compiler.hooks.compilation.tap(pluginName, onCompilation) : compiler.plugin('compilation', onCompilation);
  compiler.hooks ? compiler.hooks.emit.tapAsync(pluginName, onEmit.bind(this)) :  compiler.plugin('emit', onEmit.bind(this));
};

PatchjsWebpackPlugin.prototype.validateVersion = function (reqUrl, callback) {
  const timeout = this.options.timeout;
  co(function * () { // es6 co
    const result = yield urllib.requestThunk(reqUrl, {timeout: timeout});
    if (result.status === 200) {
      callback(false);
    } else {
      callback(true);
    }
  }).catch((e) => {
    logger.err(e);
    callback(true);
  });
}

// diff build js
PatchjsWebpackPlugin.prototype.buildDiffFile = function (diffFile, content, callback) {
  const timeout = this.options.timeout;
  co(function * () { // es6 co
    const result = yield urllib.requestThunk(diffFile.localReqUrl, {timeout: timeout});
    const localFileContent = result.data.toString();
    if (result.status === 200) {
      const result = calcDiffData(localFileContent, content);
      let diffResult = {
        diffFileName: diffFile.diffFileName,
        source: JSON.stringify(result)
      };
      callback(diffResult);
    } else {
      const msg = `URL Not Found: ${diffFile.localReqUrl}`;
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
