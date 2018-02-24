const gutil = require('gulp-util');

const production = !gutil.env.dev && !gutil.env.development;
const analyzeJSBundle = !!gutil.env['analyze-js-bundle'];
const sourceMaps = !!gutil.env['source-maps'];

const watcherEventLog = (event, path) => {
    console.log(`[${event}] /${path.replace(/\\/g, '/')}`);
};

module.exports = {
    pages: [{
        key: 'index',
        pageTitle: 'Restaurant Reviews'
    }, {
        key: 'restaurant',
        pageTitle: 'Restaurant Info'
    }],

    destination: 'build',
    production: production,

    analyzeJSBundle: analyzeJSBundle,
    sourceMaps: sourceMaps,

    logWatcherEvents: (watcher) => {
        watcher.on('change', (path) => {
            watcherEventLog('CHANGE', path);
        });

        watcher.on('add', (path) => {
            watcherEventLog('ADD', path);
        });

        watcher.on('unlink', (path) => {
            watcherEventLog('REMOVE', path);
        });
    }
};