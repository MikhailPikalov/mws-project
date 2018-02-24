const path = require('path');

const gulp = require('gulp');

const config = require('../config');

gulp.task('bundle-images', (cb) => {
    // TODO: Resize images

    gulp.src('assets/images/**')
        .pipe(gulp.dest(path.join(config.destination, '/assets/images')))
        .on('end', cb);
});