/*
 * Copyright 2016-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Karma configuration

const istanbul = require('browserify-istanbul');

const win10 = ["Windows", "10"];
const macOS = ["OSX", "Sierra"];

const chromeLatest = ["chrome", "latest"];
const firefoxLatest = ["firefox", "latest"];
const ie11 = ["ie", "11"];
const edge = ["edge", "latest"];
const safari10 = ["Safari", "10"];

function bsLauncher([os, os_version], [browser, browser_version]) {
  return {
    base: 'BrowserStack',
    browser,
    browser_version,
    os,
    os_version
  };
}


module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'mocha', 'chai'],

    client: {
      mocha: {
        timeout: 5000
      }
    },

    // list of files / patterns to load in the browser
    // (If you change this, you might want to change test/index.html too.)
    files: [
      'node_modules/quill/dist/quill.snow.css',
      'node_modules/jquery/dist/jquery.js',
      'node_modules/ckeditor/ckeditor.js',
      {pattern: 'node_modules/ckeditor/**/*', included: false},
      'node_modules/tinymce/tinymce.js',
      {pattern: 'node_modules/tinymce/**/*', included: false},
      {pattern: 'test/dummy-sidebar/**/*', included: false},
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
    reporters: ['progress', 'coverage', 'junit', 'dots', 'BrowserStack'],

    coverageReporter: {
      dir: 'tmp/reports/coverage/',
      reporters: [
        {type: 'html'},
        {type: 'json'},
        {type: 'cobertura'},
      ]
    },

    // the default configuration
    junitReporter: {
      outputDir: 'tmp/reports/junit',
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    browserStack: {
      // username: 'marcostahl2', // set by BROWSER_STACK_USERNAME
      // accessKey: '*', // set by BROWSER_STACK_ACCESS_KEY
      build: 'sidebar-js-sdk-' + (process.env.BUILD_NUMBER || 'local' + Date.now()),
      name: 'sidebar-js-sdk',
      project: 'Sidebar JS SDK',
      retryLimit: 6,
    },

    // https://oligofren.wordpress.com/2014/05/27/running-karma-tests-on-browserstack/
    browserDisconnectTimeout: 10000, // default 2000
    browserDisconnectTolerance: 1, // default 0
    browserNoActivityTimeout: 4 * 60 * 1000, //default 10000
    captureTimeout: 4 * 60 * 1000, //default 60000

    concurrency: 1,

    customLaunchers: {
      bs_ie11_win: bsLauncher(win10, ie11),
      bs_edge_win: bsLauncher(win10, edge),
      bs_chrome_win: bsLauncher(win10, chromeLatest),
      bs_firefox_win: bsLauncher(win10, firefoxLatest),
      bs_safari_macos: bsLauncher(macOS, safari10),
    },

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS', 'bs_ie11_win', 'bs_edge_win', 'bs_chrome_win', 'bs_firefox_win', 'bs_safari_macos'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
