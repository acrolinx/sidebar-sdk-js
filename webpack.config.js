const path = require('path');

module.exports = {
  entry: {
    'acrolinx-sidebar-integration': './src/acrolinx-sidebar-integration.ts',
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
    publicPath: "/distrib/",
    path: path.resolve(__dirname, 'distrib')
  }
};