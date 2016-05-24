var gulp         = require('gulp'),
    resize       = require('./index')
    ;

gulp.task('resize', function () {
    return gulp
        .src('./example/*.html')
        .pipe(resize({
            'destPath' : './dist',
            'force'    : true
        }))
        .pipe(gulp.dest('', { cwd: './dist' }));
});
