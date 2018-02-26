const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const gulp = require('gulp');
const rename = require('gulp-rename');
const ejs = require('gulp-ejs');

const config = require('../config');

gulp.task('generate-sw', (cb) => {
    // Get styles and scripts manifests

    const getManifest = (manifestName) => {
        return JSON.parse(fs.readFileSync(path.resolve(path.join(config.destination, 'assets/' + manifestName))));
    };

    const webpackManifest = getManifest('webpack-manifest.json');
    const stylesManifest = getManifest('styles-manifest.json');


    // Generate service worker static hash

    const scriptsHashes = Object.values(webpackManifest).map(x => x.js.replace(/.*\.(.+)?\.js/g, '$1'));
    const stylesHashes = Object.values(stylesManifest).map(x => x.replace(/.*\.(.+)?\.css/g, '$1'));

    const swHash = crypto.createHash('md5').update(scriptsHashes.join('') + stylesHashes.join('')).digest('hex');


    // Build service worker, using generated previously hash for static resources as cache version

    gulp.src('assets/scripts/sw/index.js')
        .pipe(ejs({
            STATIC_CACHE_VERSION: swHash
        }))
        .pipe(rename({
            basename: 'sw'
        }))
        .pipe(gulp.dest(config.destination))
        .on('end', () => {
            cb();
        });
});