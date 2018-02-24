const webpack = require('webpack');
const gulp = require('gulp');
const gutil = require('gulp-util');

const config = require('../config');
const webpackConfig = require('../../webpack.config');


gulp.task('bundle-scripts', (cb) => {
    webpack(webpackConfig, (err, stats) => {
        if (err) throw new gutil.PluginError('webpack', err);

        let logText = stats.toString({
            // output options
        });

        const isItWatchTask = gutil.env._[0] === 'watch';
        logText = isItWatchTask ? logText.substr(0, 1000).trim() : logText;

        gutil.log('[webpack stats]', `${logText}... ${isItWatchTask ? '\n[↑ Rest of the \'webpack stats\' output omitted]' : '\n[↑ All of \'webpack\' stats]'}`);

        cb();
    });
});