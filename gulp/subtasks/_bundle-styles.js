const path = require('path');

const gulp = require('gulp');

const preprocess = require('gulp-preprocess');

const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');

const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const rev = require('gulp-rev');
const revFormat = require('gulp-rev-format');

const autoprefixer = require('gulp-autoprefixer');

const config = require('../config');

gulp.task('bundle-styles', (cb) => {
    const stylesSource = 'assets/styles';
    const cssDestination = path.join(config.destination, '/assets/css');
    const manifestDestination = path.join(config.destination, '/assets');

    const cleanCSSConfig = {
        keepSpecialComments: 1, // Keep first only
        rebase: false, // Skip URL rebasing
        roundingPrecision: -1, // Do not mess with precision

        advanced: false // Disable selector & property merging, reduction, etc.
    };


    let flow = gulp
        .src(path.join(stylesSource, 'bundle.scss'))
        .pipe(preprocess({context: {PRODUCTION: config.production}}));

    if (!config.production) flow = flow.pipe(sourcemaps.init());

    flow = flow
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(autoprefixer({browsers: ['> 1%', 'ie >= 9']}))
        .pipe(concat(`bundle.css`));

    if (config.production) flow = flow.pipe(cleanCSS(cleanCSSConfig));

    if (!config.production) flow = flow.pipe(sourcemaps.write());

    flow
        .pipe(rev())
        .pipe(revFormat({
            prefix: '.',
            suffix: (config.production ? '.min' : '')
        }))
        .pipe(gulp.dest(cssDestination))
        .pipe(rev.manifest(path.join(manifestDestination, 'styles-manifest.json'), {
            base: manifestDestination,
            merge: true
        }))
        .pipe(gulp.dest(manifestDestination))
        .on('end', cb);
});