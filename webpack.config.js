var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: './src/main.js',
    debug: false,
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/dist/',
        filename: 'build.js'
    },
    resolveLoader: {
        root: path.join(__dirname, 'node_modules')
    },
    module: {
        loaders: [
            {
                test: /\.vue$/,
                loader: 'vue'
            }, {
                test: /\.styl$/,
                loader: 'style-loader!css-loader!stylus-loader'
            }, {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract(
                  'style-loader', 'css-loader?sourceMap!cssnext-loader')
            },
            {
                test: /\.js$/,
                loader: 'babel',
                exclude: /node_modules/
            },
            {
                test: /\.json$/,
                loader: 'json'
            },
            {
                test: /\.html$/,
                loader: 'vue-html'
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader?name=images/[hash].[ext]'
            }
        ]
    },
    vue: {
        css: ExtractTextPlugin.extract('css'),
        stylus: ExtractTextPlugin.extract('css!stylus-loader')
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true
    },
    devtool: '#source-map'
};

if (process.env.NODE_ENV === 'production') {
    module.exports.devtool = '#source-map';
    // http://vuejs.github.io/vue-loader/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.optimize.OccurenceOrderPlugin()
    ]);
}
