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
        SERIALIZED_CSS_BUNDLE: null,

        SERIALIZED_JS_VENDOR_BUNDLE: null,
        SERIALIZED_JS_PAGE_BUNDLES: null,
    };

    if (config.serializeCSSBundle) {
        // Serialize css

        const absolutePathToStyleBundle = path.resolve(path.join(config.destination, 'assets/css/' + stylesManifest['bundle.css']));
        let fileContents = fs.readFileSync(absolutePathToStyleBundle).toString();

        ejsExtraParams.SERIALIZED_CSS_BUNDLE = `<style type="text/css">${fileContents}</style>`;
    }

    if (config.serializeJSBundles) {
        // Vendor

        const absolutePathToVendorScriptBundle = path.resolve(path.join(config.destination, 'assets/js/' + webpackManifest.vendor.js));
        let fileContents = fs.readFileSync(absolutePathToVendorScriptBundle).toString();

        ejsExtraParams.SERIALIZED_JS_VENDOR_BUNDLE = `<script type="text/javascript">${fileContents}</script>`;


        // Pages

        ejsExtraParams.SERIALIZED_JS_PAGE_BUNDLES = {};

        config.pages.forEach(page => {
            const absolutePathToPageScriptBundle = path.resolve(path.join(config.destination, 'assets/js/' + webpackManifest[page.key].js));
            let fileContents = fs.readFileSync(absolutePathToPageScriptBundle).toString();

            ejsExtraParams.SERIALIZED_JS_PAGE_BUNDLES[page.key] = `<script type="text/javascript">${fileContents}</script>`;
        });
    }


    // Generate image previews in base64

    function base64_encode(file) {
        let bitmap = fs.readFileSync(path.resolve(file));
        return 'data:image/jpeg;base64,' + new Buffer(bitmap).toString('base64');
    }

    ejsExtraParams.RESTAURANTS_PLACEHOLDER_IMAGES = new Array(10).fill(0).map((x, i) => base64_encode(path.join(config.destination, `/assets/images/preview/${i + 1}.jpg`)));


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