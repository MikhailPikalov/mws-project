const gulp = require('gulp');

const config = require('../config');

gulp.task('watch-scripts', () => {
    const watcher = gulp.watch(['assets/scripts/**/*.js'], gulp.series('bundle-scripts', 'generate-html'));

    config.logWatcherEvents(watcher);
});