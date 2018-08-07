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

export function getBuildConfig (buildCfgPath) {
  let content = fs.readFileSync(buildCfgPath, {
    encoding: 'utf8'
  });
  if (!content) {
    content = '{}';
  }
  let pkg = JSON.parse(content);
  return pkg;
}

export function calcDiffFileName (fileName, path, version, count) {
  const lastDotIndex = version.lastIndexOf('.');
  const prefix = version.substring(0, lastDotIndex);
  const suffix = version.substring(lastDotIndex + 1);
  const extName = fileName.substring(fileName.lastIndexOf('.'));
  let diffFileNameArray = [];
  for (let i = 1; i < count + 1; i++) {
    const data = {};
    const patchVersion = parseInt(suffix, 10) - i;
    if (patchVersion < 0) {
      break;
    }
    const localVersion = `${prefix}.${patchVersion.toString()}`;
    data.localFileUrl = `${path}${localVersion}/${fileName}`;
    data.diffFileName = fileName.replace(new RegExp(extName + '$', 'i'), `-${localVersion}${extName}`);
    diffFileNameArray.push(data);
  }
  return diffFileNameArray;
}
