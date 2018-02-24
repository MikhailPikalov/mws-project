const gulp = require('gulp');

const config = require('../config');

gulp.task('watch-styles', () => {
    const watcher = gulp.watch(['assets/styles/**/*.scss'], gulp.series('bundle-styles', 'generate-html'));

    config.logWatcherEvents(watcher);
});