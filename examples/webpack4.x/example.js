require('./main.css');
require('./moduletest');

console.log('example ');

console.log('test3b');
console.log('0.0.8');

require.ensure([], function (require) {
  require('./dynamic.js');
}, 'dynamic');
