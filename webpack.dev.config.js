const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    'acrolinx-sidebar-sdk': './src/export-for-browser.ts',
    'tests': './test/index.ts'
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
    publicPath: "/dist/",
    path: path.resolve(__dirname, 'dist')
  },
};
