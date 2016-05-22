const map = require('map-stream'),
      rext = require('replace-ext'),
      gutil = require('gulp-util'),
      path = require('path'),
      imgresize = require('./resize.js')
;

const PLUGIN_NAME = 'gulp-htmlresizer';

module.exports = function (options) {
  'use strict';
  if (!options) {
      options = {};
  }

  function modifyContents(file, cb) {
    var data = file.data || options.data || {};
    var relPath = path.relative(file.cwd, file.base);
    file.contents = new Buffer(imgresize(String(file.contents), relPath, options.destPath));
    cb(null, file);
  }

  return map(modifyContents);
};
