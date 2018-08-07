import fs from 'fs';

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
