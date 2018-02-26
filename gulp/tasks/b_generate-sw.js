const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const rename = require('gulp-rename');
const ejs = require('gulp-ejs');

const config = require('../config');

gulp.task('generate-sw', (cb) => {
    // Get a list of root-level static assets

    const rootAssetsPath = './assets/root/';
    const rootAssetsFilenames = fs.readdirSync(rootAssetsPath).filter(function (file) {
        return !fs.statSync(path.join(rootAssetsPath, file)).isDirectory();
    });


    // Get manifests, generate service worker static hash

    const manifests = config.getManifests();
    const swHash = config.generateSwHash(manifests);

    const {webpackManifest, stylesManifest} = manifests;


    // Build service worker, using generated previously hash for static resources as cache version

    gulp.src('assets/scripts/sw/index.js')
        .pipe(ejs({
            STATIC_CACHE_VERSION: swHash,

            WEBPACK_MANIFEST: webpackManifest,
            STYLES_MANIFEST: stylesManifest,

            ROOT_ASSETS_FILENAMES: rootAssetsFilenames
        }))
        .pipe(rename({
            basename: 'sw'
        }))
        .pipe(gulp.dest(config.destination))
        .on('end', () => {
            cb();
        });
});