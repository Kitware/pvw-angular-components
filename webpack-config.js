// Modules
var webpack = require('webpack');

module.exports = {
  plugins: [],
  entry: './lib/index.js',
  output: {
    path: './dist',
    filename: 'PvwAngularComponents.js',
  },
  module: {
    preLoaders: [
      {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: "jshint!babel"
      }
    ],
    loaders: [
        {
          test: require.resolve("./lib/index.js"),
          loader: "expose?PvwAngularComponents"
        },{
          test: /\.html$/,
          loader: 'raw'
        },{
          test: /\.css$/,
          loader: "style-loader!css-loader!autoprefixer-loader?browsers=last 2 version"
        },{
          test: /\.(png|jpg|svg)$/,
          loader: 'url-loader?limit=100000'
        }
    ]
  },
  jshint: {
    esnext: true,
    browser: true,
    devel: true,
    globalstrict: true // Babel add 'use strict'
  },
  externals: {
    "angular": true,
    "vtkWeb": true,
    "jQuery": true,
    "angular-material": "'ngMaterial'",
    "pv": true
  }
};
