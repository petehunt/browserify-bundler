function Runtime(bundleMap, fetchAndEvalBundles) {
  this.bundleMap = bundleMap;
  this.fetchAndEvalBundles = fetchAndEvalBundles;
  this.fetchedBundles = {};
}

Runtime.prototype._getModulesToFetch = function(moduleID, accum) {
  // Look at the dependencies we need to fetch and add them to accum
  // TODO: we could precompute this at build time
  if (accum[moduleID]) {
    // Don't traverse modules we've already searched.
    return;
  }
  if (!this.fetchedBundles[moduleID]) {
    accum[moduleID] = true;
  }
  this.bundleMap[moduleID].dependencies.forEach(function(dependencyModuleID) {
    this._getModulesToFetch(dependencyModuleID, accum);
  }.bind(this));
};

Runtime.prototype._getBundlesToFetch = function(moduleID) {
  // TODO: this could be made more efficient
  var modulesToFetch = {};
  this._getModulesToFetch(moduleID, modulesToFetch);
  var bundlesToFetch = {};
  for (var moduleIDToFetch in modulesToFetch) {
    bundlesToFetch[this.bundleMap[moduleID].bundle] = true;
  }
  return bundlesToFetch;
};

Runtime.prototype.asyncRequire = function(moduleID, cb) {
  // TODO:
  if (this.fetchedBundles[this.bundleMap[moduleID].bundle]) {
    cb(require(moduleID));
  } else {
    var bundlesToFetch = this._getBundlesToFetch(moduleID);
    this.fetchAndEvalBundles(bundlesToFetch, function() {
      cb(require(moduleID));
    });
  }
};

module.exports = Runtime;