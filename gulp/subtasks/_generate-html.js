const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const rename = require('gulp-rename');
const ejs = require('gulp-ejs');

const config = require('../config');

gulp.task('generate-html', (cb) => {
    // Get styles and scripts manifests

    const manifests = config.getManifests();
    const {webpackManifest, stylesManifest} = manifests;


    // Ejs extra params

    const ejsExtraParams = {
        SERIALIZED_CSS_BUNDLE: null
    };

    if (config.serializeCSSBundle) {
        // Serialize css

        const absolutePathToStyleBundle = path.resolve(path.join(config.destination, 'assets/css/' + stylesManifest['bundle.css']));
        let fileContents = fs.readFileSync(absolutePathToStyleBundle).toString();

        ejsExtraParams.SERIALIZED_CSS_BUNDLE = `<style type="text/css">${fileContents}</style>`;
    }


    // Process pages

    let processed = 0;

    config.pages.forEach(page => {
        gulp.src('./html/layout.html')
            .pipe(ejs(Object.assign({}, ejsExtraParams, {
                PAGE_NAME: page.key,
                PAGE_TITLE: page.pageTitle,

                CSS_BUNDLE_NAME: stylesManifest['bundle.css'],

                VENDOR_CHUNK_NAME: webpackManifest.vendor.js,
                PAGE_CHUNK_NAME: webpackManifest[page.key].js,

                GOOGLE_MAPS_API_KEY: config.googleMapsApiKey
            })))
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