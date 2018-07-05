const path = require('path');

const gulp = require('gulp');

const config = require('../config');

gulp.task('move-images', (cb) => {
    gulp.src(['assets/images/*.@(png|jpg)', 'assets/images/processed/**'])
        .pipe(gulp.dest(path.join(config.destination, '/assets/images')))
        .on('end', cb);
});