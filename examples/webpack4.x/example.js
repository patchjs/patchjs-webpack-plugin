require('./main.css');
require('./moduletest');

console.log('example ');

console.log('test3b');

require.ensure([], function (require) {
  require('./dynamic.js');
}, 'dynamic');
