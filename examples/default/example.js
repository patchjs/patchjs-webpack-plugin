require('./main.css');
require('./moduletest');

require.ensure([], function (require) {
  require('./dynamic.js');
  console.log('dynamic')
}, 'dynamic');

require.ensure([], function (require) {
  require('./dynamic1.js');
});
