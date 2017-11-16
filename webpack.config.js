const path = require('path');

module.exports = {
  entry: './src/acrolinx-sidebar-integration.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'acrolinx-sidebar-integration.js',
    publicPath: "/distrib/",
    path: path.resolve(__dirname, 'distrib')
  }
};