const gulp = require('gulp');

const config = require('../config');

gulp.task('move-data-json', () => {
    return gulp.src('./data.json')
        .pipe(gulp.dest(config.destination));
});