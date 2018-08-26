const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const gutil = require('gulp-util');

const production = !gutil.env.dev && !gutil.env.development;
const analyzeJSBundle = !!gutil.env['analyze-js-bundle'];
const sourceMaps = !!gutil.env['source-maps'];

const watcherEventLog = (event, path) => {
    console.log(`[${event}] /${path.replace(/\\/g, '/')}`);
};

const destination = 'build';

module.exports = {

    // Project pages & build-time required page info

    pages: [{
        key: 'index',
        pageTitle: 'Restaurant Reviews'
    }, {
        key: 'restaurant',
        pageTitle: 'Restaurant Info'
    }],


    // Build settings

    destination: destination,

    cacheForeignResources: false,
    serializeCSSBundle: true,
    serializeJSBundles: true,

    googleMapsApiKey: 'AIzaSyAd8uWtGNH7nh3NVxrsQNhV-rqAWmLQdXo',

    magick: false, // true - ImageMagick, false - GraphicsMagick


    // Build flags

    production: production,

    analyzeJSBundle: analyzeJSBundle,
    sourceMaps: sourceMaps,


    // Build process helpers

    getManifests: () => {
        const getManifest = (manifestName) => {
            return JSON.parse(fs.readFileSync(path.resolve(path.join(destination, 'assets/' + manifestName))));
        };

        return {
            webpackManifest: getManifest('webpack-manifest.json'),
            stylesManifest: getManifest('styles-manifest.json')
        };
    },

    generateSwHash: ({webpackManifest, stylesManifest}) => {
        const scriptsHashes = Object.values(webpackManifest).map(x => x.js.replace(/.*\.(.+)?\.js/g, '$1'));
        const stylesHashes = Object.values(stylesManifest).map(x => x.replace(/.*\.(.+)?\.css/g, '$1'));

        return crypto.createHash('md5').update(scriptsHashes.join('') + stylesHashes.join('')).digest('hex');
    },

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