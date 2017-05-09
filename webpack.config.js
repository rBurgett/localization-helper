const webpack = require('webpack');

module.exports = {
    entry: './app/src/index.jsx',
    output: {
        path: './app/dist/',
        filename: 'index.js'
    },
    stats: {
        colors: true
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        })
    ],
    module: {
        loaders: [{
            test: /\.jsx?$/,
            exclude: /(node_modules)/,
            loaders: ['babel']
        }]
    }
};
