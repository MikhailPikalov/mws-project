const gulp = require('gulp');

gulp.task('default', gulp.series(
    'clean-assets',

    gulp.parallel(
        'move-root-folder',

        gulp.series(
            gulp.parallel(
                'move-images',
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