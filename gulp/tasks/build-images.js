const gulp = require('gulp');
const rename = require('gulp-rename');
const del = require('del');
const resize = require('gulp-image-resize');
const imagemin = require('gulp-imagemin');
const imageminWebP = require('imagemin-webp');

const config = require('../config');

gulp.task('build-images', (cb) => {
    del([
        'assets/images/processed/',
    ], {force: true}).then(() => {
        resizeImages();
    });

    function resizeImages() {
        const sizes = [284, 568, 590, 1180];

        let resizesDone = 0;

        sizes.forEach(size => {
            gulp.src('assets/images/src/**')
                .pipe(resize({
                    imageMagick: config.magick,

                    width: size,

                    quality: [0.6, 0.7, 0.8, 0.9][sizes.indexOf(size)],
                    upscale: true
                }))
                .pipe(gulp.dest(`assets/images/tmp/${size}/`))
                .on('end', () => {
                    console.log(`✔ Resize to ${size}px done.`);

                    resizesDone++;

                    if (resizesDone === sizes.length + 1) optimizeAndMakeWebP();
                });
        });

        gulp.src('assets/images/src/**')
            .pipe(resize({
                imageMagick: config.magick,

                width: 100,
                quality: [0.4]
            }))
            .pipe(gulp.dest(`assets/images/processed/preview/`))
            .on('end', () => {
                console.log(`✔ Resize to ${200}px (preview) done.`);

                resizesDone++;

                if (resizesDone === sizes.length + 1) optimizeAndMakeWebP();
            });
    }

    function optimizeAndMakeWebP() {
        console.log('Optimizations:');

        let jpgDone = false,
            webpDone = false;

        gulp.src('assets/images/tmp/**/*.jpg')
            .pipe(imagemin([
                imagemin.jpegtran({progressive: true})
            ], {
                verbose: true
            }))
            .pipe(gulp.dest('assets/images/processed/'))
            .on('end', () => {
                jpgDone = true;

                if (webpDone) cleanUpTemporaryFolder();
            });

        gulp.src('assets/images/tmp/**/*.jpg')
            .pipe(imagemin([
                imageminWebP({quality: 50, method: 6})
            ], {
                verbose: true
            }))
            .pipe(rename({
                extname: '.webp'
            }))
            .pipe(gulp.dest('assets/images/processed/'))
            .on('end', () => {
                webpDone = true;

                if (jpgDone) cleanUpTemporaryFolder();
            });
    }

    function cleanUpTemporaryFolder() {
        del([
            'assets/images/tmp/',
        ], {force: true}).then(() => {
            cb();
        });
    }
});