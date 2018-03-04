const path = require('path');

const webpack = require('webpack');
const WebpackMd5Hash = require('webpack-md5-hash');
const ChunkManifestPlugin = require('chunk-manifest-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const config = require('./gulp/config');

const entries = {
    vendor: [
        './assets/scripts/dbhelper.js',
        './assets/scripts/page-obj.js'
    ]
};

config.pages.forEach(page => {
    entries[page.key] = [`./assets/scripts/pages/${page.key}.js`];
});

const webpackConfig = {
    entry: entries,

    output: {
        path: path.resolve(path.join(config.destination, '/assets/js/')), // File system output location
        publicPath: '/assets/js/', // As will be referenced in browser

        filename: `[name].[${config.production ? 'chunkhash' : 'hash'}]${config.production ? '.min' : ''}.js`,
        chunkFilename: `[name].[${config.production ? 'chunkhash' : 'hash'}]${config.production ? '.min' : ''}.js`,

        pathinfo: !config.production
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,

                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-es2015']
                    }
                }
            },
            {
                test: /\.ejs$/,
                loader: 'ejs-loader'
            }
        ]
    },

    node: {
        fs: 'empty'
    },
    plugins: [
        new webpack.DefinePlugin({
            // Proxy object to use in scripts, for now is not used
            'ENV_PROXY.PRODUCTION': config.production,
        }),

        new WebpackMd5Hash(),
        new webpack.optimize.CommonsChunkPlugin({
            name: "vendor",
            minChunks: Infinity,
        }),
        new AssetsPlugin({
            filename: 'webpack-manifest.json',

            path: path.join(__dirname, config.destination, 'assets'),

            fullPath: false
        }),
        new ChunkManifestPlugin({
            filename: '../../../build/assets/webpack-chunk-manifest.json',
            manifestVariable: "webpackChunkManifest"
        }),
        new webpack.optimize.OccurrenceOrderPlugin()
    ]
};

if (config.analyzeJSBundle) {
    webpackConfig.plugins.push(new BundleAnalyzerPlugin());
}

if (config.sourceMaps) {
    webpackConfig.devtool = 'eval-source-map';
}

if (config.production) {
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        compress: {
            warnings: false
        },
        output: {
            comments: false
        }
    }));
}

module.exports = webpackConfig;