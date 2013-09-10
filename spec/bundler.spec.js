var bundle = require('../index');

describe('bundle', function() {
  it('should work', function() {
    var bundles = null;
    var bundleMap = null;

    runs(function() {
      bundle({
        'core': ['./test/copyProperties'],
        'react': ['./test/react'],
        'app': ['./test/app']
      }, function(_bundles, _bundleMap) {
        bundles = _bundles;
        bundleMap = _bundleMap;
      });
    });

    waitsFor(function() {
      return bundles;
    });

    runs(function() {
      var names = ['react', 'reactMount', 'copyProperties', 'app'];
      function expectBundle(bundle, desiredNames) {
        names.forEach(function(name) {
          var index = bundle.indexOf('module.exports = \'' + name + '\'');
          if (desiredNames.indexOf(name) > -1) {
            expect(index).not.toBe(-1);
          } else {
            expect(index).toBe(-1);
          }
        });
      }
      expectBundle(bundles.core, ['copyProperties']);
      expectBundle(bundles.react, ['react', 'reactMount']);
      expectBundle(bundles.app, ['app']);

      // next ensure that they actually work.
      function guard() {
        // TODO: if you don't load these in the right order they fail. what a great library.
        var require = eval(bundles.core);
        require = eval(bundles.react);
        require = eval(bundles.app);
        expect(require('./test/app')).toBe('app react');
      }
      guard();
    });
  });
});