const gulp = require('gulp');

const config = require('../config');

gulp.task('watch-sw', () => {
    const watcher = gulp.watch(['assets/scripts/sw/index.js'], gulp.task('generate-sw'));

    config.logWatcherEvents(watcher);
});