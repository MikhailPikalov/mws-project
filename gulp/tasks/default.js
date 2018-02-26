const gulp = require('gulp');

gulp.task('default', gulp.series(
    'clean-assets',

    gulp.parallel(
        'bundle-images',
        'move-root-folder',

        gulp.series(
            gulp.parallel(
                'bundle-scripts',
                'bundle-styles'
            ),
            gulp.parallel(
                'generate-html',
                'generate-sw'
            )
        )
    )
));