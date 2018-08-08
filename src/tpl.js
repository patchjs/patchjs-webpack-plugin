export const codeTpl = `
  if (window.patchjs) {
    var timeout = setTimeout(onComplete, 120000);
    function onComplete() {
      clearTimeout(timeout);
      var chunk = installedChunks[chunkId];
      if(chunk !== 0) {
        if(chunk) chunk[1](new Error('Loading chunk ' + chunkId + ' failed.'));
        installedChunks[chunkId] = undefined;
      }
    };
    window.patchjs.wait().load(src, onComplete);
  } else {
    throw new Error('The loader of Patch.js is missing.');
  }
`;
