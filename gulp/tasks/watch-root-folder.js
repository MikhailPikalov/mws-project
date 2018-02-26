const gulp = require('gulp');

const config = require('../config');

gulp.task('watch-root-folder', () => {
    const watcher = gulp.watch('assets/root/*.*', gulp.parallel('move-root-folder', 'generate-sw'));
    
    config.logWatcherEvents(watcher);
});