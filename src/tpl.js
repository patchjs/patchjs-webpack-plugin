export const codeTpl = `
function checkChunk () {
  var chunk = installedChunks[chunkId];
  if(chunk !== 0) {
    if(chunk) chunk[1](new Error('Loading chunk ' + chunkId + ' failed.'));
    installedChunks[chunkId] = undefined;
  }
}

if (patchjs) {
  var timeout = setTimeout(onComplete, 120000);
  function onComplete() {
    clearTimeout(timeout);
    checkChunk();
  };
  patchjs.wait().load(src, onComplete);
} else {
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.charset = 'utf-8';
  script.async = true;
  script.timeout = 120000;
  if (__webpack_require__.nc) {
    script.setAttribute("nonce", __webpack_require__.nc);
  }
  script.src = src
  var timeout = setTimeout(onScriptComplete, 120000);
  script.onerror = script.onload = onScriptComplete;
  function onScriptComplete() {
    // avoid mem leaks in IE.
    script.onerror = script.onload = null;
    clearTimeout(timeout);
    checkChunk();
  };
  head.appendChild(script);
}`
