const gulp = require('gulp');

gulp.task('default', gulp.series(
    'clean-assets',

    gulp.parallel(
        'bundle-images',
        'move-data-json',

        gulp.series(
            gulp.parallel(
                'bundle-scripts',
                'bundle-styles'
            ),
            'generate-html'
        )
    )
));