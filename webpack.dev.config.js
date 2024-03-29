const path = require('path');

module.exports = {
  mode: 'development',
  target: ['web', 'es5'],
  entry: {
    'acrolinx-sidebar-sdk': './src/export-for-browser.ts',
    tests: './test/index.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          transpileOnly: true
        }
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: '[name].js',
    publicPath: '/dist/',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    static: {
      directory: path.join(__dirname, '.'),
    },
    compress: true,
    port: 9000,
  },
};
