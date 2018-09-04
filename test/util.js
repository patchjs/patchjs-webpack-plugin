/* eslint-env node, mocha */
import expect from 'expect.js';
import {logger, calcDiffFileName, getPkgConfig} from '../src/util';

describe('util.js', () => {
  it('logger', () => {
    expect(logger.err).to.be.an('function');
    expect(logger.warn).to.be.an('function');
    expect(logger.info).to.be.an('function');
  });

  const testPath = __dirname;
  const pkgPath = testPath + '/data/package.json';

  describe('config.js', () => {
    it('getPkgConfig (pkgPath)', () => {
      expect(getPkgConfig(pkgPath).version).to.be('3.4.5');
    });
  });

  it('calcDiffFileName (fileName, path, version, count)', () => {
    const path = 'https://static.domain.com/patchjs/';
    // normal case
    let fileName = 'index.js';
    expect(calcDiffFileName(fileName, path, '0.1.5', 3)).to.eql([{
      localReqUrl: path + '0.1.4/index.js',
      diffFileName: 'index-0.1.4.js'
    }, {
      localReqUrl: path + '0.1.3/index.js',
      diffFileName: 'index-0.1.3.js'
    }, {
      localReqUrl: path + '0.1.2/index.js',
      diffFileName: 'index-0.1.2.js'
    }]);

    expect(calcDiffFileName(fileName, path, '0.0.1', 3)).to.eql([{
      localReqUrl: path + '0.0.0/index.js',
      diffFileName: 'index-0.0.0.js'
    }]);

    let fileNameWithVersion = '0.0.1/index.js';
    expect(calcDiffFileName(fileNameWithVersion, path, '0.0.1', 3)).to.eql([{
      localReqUrl: path + '0.0.0/index.js',
      diffFileName: '0.0.1/index-0.0.0.js'
    }]);

    expect(calcDiffFileName(fileName, path, '0.0.2', 3)).to.eql([{
      localReqUrl: path + '0.0.1/index.js',
      diffFileName: 'index-0.0.1.js'
    }, {
      localReqUrl: path + '0.0.0/index.js',
      diffFileName: 'index-0.0.0.js'
    }]);
  });
});
