const gulp = require('gulp');

const config = require('../config');

gulp.task('watch-styles', () => {
    const watcher = gulp.watch(['assets/styles/**/*.scss'], gulp.series(
        'bundle-styles',

        gulp.parallel(
            'generate-html',
            'generate-sw'
        )
    ));

    config.logWatcherEvents(watcher);
});