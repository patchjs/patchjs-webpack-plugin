/* eslint-env node, mocha */
import expect from 'expect.js';
import {getEntryConfig, setEntryConfig, getBuildConfig} from '../src/config';

const testPath = __dirname;
const patchCfgPath = testPath + '/data/index.html';
const buildCfgPath = testPath + '/data/package.json';

describe('config.js', () => {
  it('getEntryConfig (patchCfgPath)', () => {
    expect(getEntryConfig(patchCfgPath)).to.eql({
      version: '0.1.0'
    });
  });

  it('setEntryConfig (patchCfgPath, version)', () => {
    const version = '0.1.1';
    setEntryConfig(patchCfgPath, version);
    expect(getEntryConfig(patchCfgPath)).to.eql({
      version: '0.1.1'
    });
    setEntryConfig(patchCfgPath, '0.1.0');
  });

  it('getBuildConfig (buildCfgPath)', () => {
    expect(getBuildConfig(buildCfgPath).version).to.be('3.4.5');
  });
});
