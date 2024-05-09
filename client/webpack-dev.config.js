const { HotModuleReplacementPlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const socketConfig = require('../config');

module.exports = {
  mode: 'development',
  context: __dirname,
  entry: {
    app: './src/index.js'
  },
  output: {
    filename: 'js/[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader', 
          'css-loader',
          {
            loader: 'postcss-loader', // This loader applies Tailwind CSS using PostCSS.
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'), // Path to your Tailwind config
                  require('autoprefixer'), // Adds vendor prefixes for compatibility
                ]
              }
            }
          }
        ]
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      title: 'Nano Video-Call/Screen sharing - Bright',
      filename: 'index.html',
      template: 'src/html/index.html'
    })
  ],
  devServer: {
    compress: true,
    port: 3000,

    proxy: {
      '/bridge/': `http://localhost:${socketConfig.PORT}`,
      transports: ['websocket'],

      secure: false,
      changeOrigin: true, // might be necessary if your backend server uses host-based routing
      logLevel: 'debug' // enables detailed logging for the proxy
    }
  },
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  }
};
