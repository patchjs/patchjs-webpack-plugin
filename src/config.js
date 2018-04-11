import fs from 'fs';

export function getEntryConfig (patchCfgPath) {
  let content = fs.readFileSync(patchCfgPath, {
    encoding: 'utf8'
  });
  content = content.replace(/<!--[\s\S]+?-->/g, '');
  const result = content.match(/<meta\s+name="patchjs"\s+content="([^"]+)"/i);
  if (!result) {
    return;
  }
  const config = {};
  const resultArray = result[1].split(',');
  resultArray.forEach((item) => {
    if (/version=/.test(item)) {
      config.version = item.split('=')[1];
    }
  });
  return config;
}

export function setEntryConfig (patchCfgPath, version) {
  let cfgContent = fs.readFileSync(patchCfgPath, {encoding: 'utf8'});
  let patchConfigReg = /<meta\s+name="patchjs"\s+content="([^"]+)">/ig;
  let pacthConfigTpl = `<meta name="patchjs" content="version=${version}">`;
  if (patchConfigReg.test(cfgContent)) {
    cfgContent = cfgContent.replace(patchConfigReg, pacthConfigTpl);
  } else {
    const headTagStartIndex = cfgContent.search(/<head>/) + 6;
    const headTagEndIndex = cfgContent.search(/<\/head>/);
    const formatString = findMetaIndent(cfgContent.substring(headTagStartIndex, headTagEndIndex));
    cfgContent = cfgContent.replace(/<head>/i, `<head>\n${formatString}${pacthConfigTpl}`);
  }
  fs.writeFileSync(patchCfgPath, cfgContent);
}

function findMetaIndent (content) {
  let formatString = '';
  let contentRowArray = content.split('\n') || [];
  if (contentRowArray.length > 0) {
    const rowString = contentRowArray[1];
    const tagIndex = rowString.search(/<[^\s]+/);
    formatString = rowString.substring(0, tagIndex);
  }
  return formatString;
}

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
