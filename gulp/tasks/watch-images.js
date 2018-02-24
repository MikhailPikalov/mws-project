const gulp = require('gulp');

const config = require('../config');

gulp.task('watch-images', () => {
    const watcher = gulp.watch('assets/images/**/*.(jpg|png)', gulp.task('bundle-images'));
    
    config.logWatcherEvents(watcher);
});