/* eslint-env node, mocha */
import expect from 'expect.js';
import {getEntryConfig, setEntryConfig, getBuildConfig} from '../src/config';

const testPath = __dirname;
const patchCfgPath = testPath + '/data/index.html';
const buildCfgPath = testPath + '/data/package.json';

describe('config.js', () => {
  it('getBuildConfig (buildCfgPath)', () => {
    expect(getBuildConfig(buildCfgPath).version).to.be('3.4.5');
  });
});
