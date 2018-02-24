const gulp = require('gulp');

gulp.task('watch', gulp.series(
    'default',

    gulp.parallel(
        'watch-scripts',
        'watch-styles',
        'watch-html',
        'watch-images'
    )
));