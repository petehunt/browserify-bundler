var bundle = require('../index');
var Runtime = require('../lib/Runtime'); // browser runtime

describe('bundle', function() {
  it('should work', function() {
    var bundles = null;
    var bundleMap = null;
    var done = false;

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

      var bundlesFetched = [];
      var runtime = new Runtime(bundleMap, function(bundlesToFetch, cb) {
        bundlesFetched = bundlesFetched.concat(Object.keys(bundlesToFetch));
        cb();
      });

      function guard() {
        // TODO: if you don't load these in the right order they fail. what a great library.
        runtime.asyncRequire('/Users/phunt/Projects/browserify-bundler/test/app.js', function(module) {
          expect(module).toBe('app react');
          expect(bundlesFetched).toEqual([
            'app', 'react', 'core'
          ]);
          done = true;
        });
      }
      guard();
    });

    waitsFor(function() {
      return done;
    });
  });
});