const path = require('path');

const MAX_SIZE_IN_BYTES = 900 * 1024;

module.exports = {
  mode: 'production',
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
  performance: {
    hints: "error",
    maxEntrypointSize: MAX_SIZE_IN_BYTES,
    maxAssetSize: MAX_SIZE_IN_BYTES
  }
};