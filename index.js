const map = require('map-stream'),
    gutil = require('gulp-util'),
    path = require('path'),
    through = require('through2'),
    imgresize = require('./resize.js');

var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-htmlresizer';

// plugin level function (dealing with files)
function gulpresize(options) {
    if (!options) {
        options = {};
    }
    // creating a stream through which each file will pass
    var stream = through.obj(function(file, enc, cb) {
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
            return cb();
        }

        if (file.isBuffer()) {
            var relPath = path.relative(file.cwd, file.base);
            file.contents = new Buffer(imgresize(String(file.contents), relPath, options));
        }

        // make sure the file goes through the next gulp plugin
        this.push(file);

        // tell the stream engine that we are done with this file
        cb();
    });

    // returning the file stream
    return stream;
};

// exporting the plugin main function
module.exports = gulpresize;
