var webpack = require('webpack');

module.exports = {
    debug: false,
    devtool: 'source-map',
    entry: './lib/client',
    output: {
        path: './lib/static',
        filename: 'client.js'
    },
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            mangle:   true,
            compress: {
                warnings: false // Suppress uglification warnings
            }
        })
    ],
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel',
                include: __dirname + '/lib/client'
            },
            {
                test: /\.hbs$/,
                loader: 'handlebars'
            }
        ]
    }
};
