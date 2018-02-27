const path = require('path');

const gulp = require('gulp');
const del = require('del');

const config = require('../config');

gulp.task('clean-assets', (cb) => {
    del([
        path.join(config.destination, 'assets')
    ], { force: true }).then(() => { cb(); });
});