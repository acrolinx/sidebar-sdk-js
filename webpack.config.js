const path = require('path');

// MAX_SIZE_IN_BYTES is set here as a warning to avoid avoid accidental bloat.
// If it gets bigger and there is no way to avoid it, we must increase this number sadly.
const MAX_SIZE_IN_BYTES = 496 * 1024;

module.exports = {
  mode: 'production',
  entry: {
    'acrolinx-sidebar-sdk': './src/export-for-browser.ts',
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
  },
  optimization: {
    minimize: true
  },
};
