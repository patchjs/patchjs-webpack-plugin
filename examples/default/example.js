require('./main.css');
require('./moduletest');

require.ensure([], function (require) {
  require('./dynamic.js');
}, 'dynamic');

require.ensure([], function (require) {
  require('./dynamic1.js');
});
