require('./main.css');
require('./moduletest');

console.log('example js2222345222');


require.ensure([], function (require) {
  require('./dynamic.js');
}, 'dynamic');

require.ensure([], function (require) {
  require('./dynamic1.js');
});
