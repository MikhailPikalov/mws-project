const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const rename = require('gulp-rename');
const preprocess = require('gulp-preprocess');
const ejs = require('gulp-ejs');

const config = require('../config');

gulp.task('generate-html', (cb) => {
    // Get styles and scripts manifests

    const getManifest = (manifestName) => {
        return JSON.parse(fs.readFileSync(path.resolve(path.join(config.destination, 'assets/' + manifestName))));
    };

    const webpackManifest = getManifest('webpack-manifest.json');
    const stylesManifest = getManifest('styles-manifest.json');


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