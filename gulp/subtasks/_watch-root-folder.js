const gulp = require('gulp');

const config = require('../config');

gulp.task('watch-root-folder', () => {
    const watcher = gulp.watch('assets/root/*.*', gulp.series('move-root-folder', 'generate-sw'));
    
    config.logWatcherEvents(watcher);
});