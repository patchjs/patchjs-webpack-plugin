/* eslint-env node, mocha */
import expect from 'expect.js';
import {logger, calcDiffFileName} from '../src/util';

describe('util.js', () => {
  it('logger', () => {
    expect(logger.vip).to.be.an('function');
    expect(logger.err).to.be.an('function');
    expect(logger.warn).to.be.an('function');
    expect(logger.info).to.be.an('function');
  });

  it('calcDiffFileName (fileName, path, version, count)', () => {
    const path = 'https://os.alipayobjects.com/patchjs/';
    // normal case
    let fileName = 'index.js';
    expect(calcDiffFileName(fileName, path, '0.1.5', 3)).to.eql([{
      oldFileUrl: path + '0.1.4/index.js',
      diffFileName: 'index-0.1.4.js'
    }, {
      oldFileUrl: path + '0.1.3/index.js',
      diffFileName: 'index-0.1.3.js'
    }, {
      oldFileUrl: path + '0.1.2/index.js',
      diffFileName: 'index-0.1.2.js'
    }]);

    expect(calcDiffFileName(fileName, path, '0.0.1', 3)).to.eql([{
      oldFileUrl: path + '0.0.0/index.js',
      diffFileName: 'index-0.0.0.js'
    }]);

    expect(calcDiffFileName(fileName, path, '0.0.2', 3)).to.eql([{
      oldFileUrl: path + '0.0.1/index.js',
      diffFileName: 'index-0.0.1.js'
    }, {
      oldFileUrl: path + '0.0.0/index.js',
      diffFileName: 'index-0.0.0.js'
    }]);
  });
});
