var browserify = require('browserify');
var externalize = require('externalize');
var through = require('through');

function bundleToSource(b, cb) {
  var buf = '';
  b.bundle().pipe(through(function write(data) {
    buf += data;
  }, function end() {
    cb(buf);
  }));
}

// bundlespec -> (bundles, bundlemap)
function bundle(bundleSpec, cb) {
  // parents are common code, externals are apps
  var browserifiedBundles = {};
  var bundleNames = Object.keys(bundleSpec);
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
    if (i === 0) {
      browserifiedBundles[bundleName] = b;
      iter();
    } else {
      var parents = Object.keys(browserifiedBundles).map(function(k) {
        return browserifiedBundles[k];
      });
      externalize(b, parents, function(err) {
        if (err) {
          console.error(err);
          return;
        }
        browserifiedBundles[bundleName] = b;
        iter();
      });
    }
  }
  iter();
}

function bundleManyToSources(browserifiedBundles, cb) {
  var srcs = {};
  var i = 0;
  var browserifiedBundleNames = Object.keys(browserifiedBundles);
  browserifiedBundleNames.forEach(function(name) {
    var browserifiedBundle = browserifiedBundles[name];
    bundleToSource(browserifiedBundle, function(src) {
      srcs[name] = src;
      i++;
      if (i === browserifiedBundleNames.length) {
        cb(srcs);
      }
    });
  });
}

bundle({
  'core': ['./test/copyProperties'],
  'react': ['./test/react'],
  'app': ['./test/app']
}, function(bundles) {
  bundleManyToSources(bundles, function(srcs) {
    console.log(srcs);
  });
});