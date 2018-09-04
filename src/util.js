import colors from 'colors';
import fs from 'fs';

export const logger = {
  err: (msg) => {
    console.log(colors.red(msg));
  },
  warn: (msg) => {
    console.log(colors.yellow(msg));
  },
  info: (msg) => {
    console.log(msg);
  }
};

export function getPkgConfig (pkgPath) {
  let content = fs.readFileSync(pkgPath, {
    encoding: 'utf8'
  });
  if (!content) {
    content = '{}';
  }
  let pkg = JSON.parse(content);
  return pkg;
}

export function calcDiffFileName (fileName, path, version, count) {
  var versionReg = /\d+\.\d+\.\d+/;
  let filePath = `${version}/${fileName}`;
  if (versionReg.test(fileName)) {
    filePath = fileName.replace(/(\d+)\.(\d+)\.(\d+)/, version);
  }
  const lastDotIndex = version.lastIndexOf('.');
  const prefix = version.substring(0, lastDotIndex);
  const extName = fileName.substring(fileName.lastIndexOf('.'));
  let patchVersion = parseInt(version.substring(lastDotIndex + 1));
  let diffFileNameArray = [];
  for (let i = 1; i < count + 1; i++) {
    patchVersion -= 1;
    if (patchVersion < 0) {
      break;
    }
    const item = {};
    const localVersion = `${prefix}.${patchVersion}`;
    item.localReqUrl = `${path}${filePath.replace(versionReg, localVersion)}`;
    item.diffFileName = fileName.replace(new RegExp(extName + '$', 'i'), `-${localVersion}${extName}`);
    diffFileNameArray.push(item);
  }
  return diffFileNameArray;
}
