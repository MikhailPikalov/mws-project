const gulp = require('gulp');

const config = require('../config');

gulp.task('watch-scripts', () => {
    const watcher = gulp.watch(['assets/scripts/**/*.js', '!assets/scripts/sw/**'], gulp.series(
        'bundle-scripts',

        gulp.parallel(
            'generate-html',
            'generate-sw'
        )
    ));

    config.logWatcherEvents(watcher);
});