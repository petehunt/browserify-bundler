var browserify = require('browserify');
var concatStream = require('concat-stream');
var mdeps = require('module-deps');

// bundlespec -> (bundles, bundlemap)
function bundle(bundleSpec, cb) {
  // parents are common code, externals are apps
  var browserifiedBundles = {};
  var bundleNames = Object.keys(bundleSpec);
  var filesToExclude = [];
  var i = -1;

  function iter() {
    i++;
    if (i === bundleNames.length) {
      cb(browserifiedBundles);
      return;
    }

    var bundleName = bundleNames[i];

    var b = browserify();
    bundleSpec[bundleName].forEach(b.require.bind(b));
    console.log('bundling', bundleName, filesToExclude);
    filesToExclude.forEach(b.ignore.bind(b));
    b.bundle().pipe(concatStream(function(src) {
      browserifiedBundles[bundleName] = src;
      mdeps(b.files, {}).pipe(concatStream(function(modules) {
        modules.forEach(function(module) {
          filesToExclude.push(module.id);
        });
        iter();
      }));
    }));
  }
  iter();
}

bundle({
  'core': ['./test/copyProperties'],
  'react': ['./test/react'],
  'app': ['./test/app']
}, function(bundles) {
  console.log(bundles);
  return;
  bundleManyToSources(bundles, function(srcs) {
    console.log(srcs);
  });
});