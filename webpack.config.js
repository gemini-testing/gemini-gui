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
        new webpack.optimize.CommonsChunkPlugin({
            name: 'main',
            children: true,
            minChunks: 2
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.MinChunkSizePlugin({ minChunkSize: 51200 }),
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
                test: /\.js/,
                loader: 'babel',
                inclue: __dirname + '/lib/client'
            },
            {
                test: /\.hbs/,
                loader: 'handlebars'
            }
        ]
    }
};
