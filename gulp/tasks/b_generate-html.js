const gulp = require('gulp');
const rename = require('gulp-rename');
const preprocess = require('gulp-preprocess');
const ejs = require('gulp-ejs');

const config = require('../config');

gulp.task('generate-html', (cb) => {
    // Get styles and scripts manifests

    const manifests = config.getManifests();
    const {webpackManifest, stylesManifest} = manifests;


    // Process pages

    let processed = 0;

    config.pages.forEach(page => {
        gulp.src('./html/layout.html')
            .pipe(preprocess({context: {
                PAGE_NAME: page.key
            }}))
            .pipe(ejs({
                PAGE_TITLE: page.pageTitle,

                CSS_BUNDLE_NAME: stylesManifest['bundle.css'],

                VENDOR_CHUNK_NAME: webpackManifest.vendor.js,
                PAGE_CHUNK_NAME: webpackManifest[page.key].js
            }))
            .pipe(rename({
                basename: page.key
            }))
            .pipe(gulp.dest(config.destination))
            .on('end', () => {
                processed++;

                if (processed === config.pages.length) cb();
            });
    });
});