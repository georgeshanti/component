// Webpack uses this to work with directories
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

// This is the main configuration object.
// Here, you write different options and tell Webpack what to do
module.exports = {
  
  // Path to your entry point. From this file Webpack will begin its work
  entry: './src/index.tsx',

  // Path and filename of your result bundle.
  // Webpack will bundle all JavaScript into this file
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
    filename: 'main.bundle.js'
  },
  plugins: [new HtmlWebpackPlugin({
    'template': './public/index.html',
  })],
  devServer: {
    hot: true,
    port: 3000,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
        },
        resolve: {
          extensions: ['.ts', '.tsx'],
        },
      },
    //   {
    //     test: /\.css$/i,
    //     include: path.resolve(__dirname, ''),
    //     use: ['style-loader', 'css-loader', 'postcss-loader'],
    //   },
    ]
  },
  optimization: {
    // minimize: false,
  },

  // Default mode for Webpack is production.
  // Depending on mode Webpack will apply different things
  // on the final bundle. For now, we don't need production's JavaScript
  // minifying and other things, so let's set mode to development
  mode: 'production',
};
