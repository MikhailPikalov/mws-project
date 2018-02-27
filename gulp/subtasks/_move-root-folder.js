const gulp = require('gulp');

const config = require('../config');

gulp.task('move-root-folder', () => {
    return gulp.src('./assets/root/*.*')
        .pipe(gulp.dest(config.destination));
});