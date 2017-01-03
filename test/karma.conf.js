// Karma configuration
// Generated on Wed Apr 30 2014 16:43:43 GMT+0200 (CEST)

const istanbul = require('browserify-istanbul');

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'mocha', 'chai'],

    // list of files / patterns to load in the browser
    // (If you change this, you might want to change test/index.html too.)
    files: [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/ckeditor/ckeditor.js',
      {pattern: 'bower_components/ckeditor/**/*', included: false},
      'bower_components/tinymce/tinymce.js',
      {pattern: 'bower_components/tinymce/**/*', included: false},
      {pattern: 'test/dummy-sidebar/**/*', included: false},
      'bower_components/jsverify/index.js',
      'tmp/compiled/**/*.js',
    ],


    // list of files to exclude
    exclude: [],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'tmp/compiled/**/*.js': ['browserify']
    },

    browserify: {
      debug: true,
      transform: [istanbul({
        ignore: ['**/node_modules/**', '**/test/**'],
      })],
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      dir: 'tmp/reports/coverage/',
      reporters: [
        {type: 'html'},
        {type: 'json'}
      ]
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
