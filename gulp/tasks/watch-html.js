const gulp = require('gulp');

const config = require('../config');

gulp.task('watch-html', () => {
    const watcher = gulp.watch(['html/**/*.html'], gulp.task('generate-html'));
    
    config.logWatcherEvents(watcher);
});