const gulp = require('gulp');

const config = require('../config');

gulp.task('watch-images', () => {
    const watcher = gulp.watch('assets/images/processed/**/*.@(jpg|png|webp)',
        gulp.series('move-images', 'generate-html')
    );
    
    config.logWatcherEvents(watcher);
});