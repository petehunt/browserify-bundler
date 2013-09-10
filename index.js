var browserify = require('browserify');
var concatStream = require('concat-stream');
var mdeps = require('module-deps');

function getObjectValues(obj) {
  var rv = [];
  for (var k in obj) {
    rv.push(obj[k]);
  }
  return rv;
}

// bundlespec -> (bundles, bundlemap)
function bundle(bundleSpec, cb, opts) {
  // parents are common code, externals are apps
  var browserifiedBundles = {};
  var bundleMap = {}; // map abs module ID to bundle it lives in
  var bundleNames = Object.keys(bundleSpec);
  var filesToExclude = [];
  var i = -1;

  function iter() {
    i++;

    if (i === bundleNames.length) {
      cb(browserifiedBundles, bundleMap);
      return;
    }

    var bundleName = bundleNames[i];

    var b = browserify(opts);

    filesToExclude.forEach(function(moduleToExclude) {
      b.external(moduleToExclude);
    });
    bundleSpec[bundleName].forEach(function(moduleToBundle) {
      b.require(moduleToBundle, {expose: moduleToBundle});
    });

    b.bundle().pipe(concatStream(function(src) {
      browserifiedBundles[bundleName] = src;
      mdeps(b.files, {}).pipe(concatStream(function(modules) {
        modules.forEach(function(module) {
          if (!bundleMap[module.id]) {
            // TODO: could compress this to just an array of bundles you need, but w/e
            bundleMap[module.id] = {
              'bundle': bundleName,
              'dependencies': getObjectValues(module.deps)
            };
          }
          filesToExclude.push(module.id);
        });
        iter();
      }));
    }));
  }
  iter();
}

module.exports = bundle;