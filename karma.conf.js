require('dotenv').config();
var webpackConfig = require('./webpack.config.js');

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files: [
      'src/index.test.js'
    ],


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/**/*.js': ['webpack']
    },

    webpack: {
      module: webpackConfig.module
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'notify'],


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
    browsers: ['Chrome', 'ChromeCanary', 'FirefoxWebComponents', 'Safari'/* 'Opera', 'IE'*/],

    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY
    },
    customLaunchers: {
      bs_firefox: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '59.0 beta',
        os: 'OS X',
        os_version: 'High Sierra'
      },
      bs_safari: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: '11.0',
        os: 'OS X',
        os_version: 'High Sierra'
      },
      bs_mobile_safari_10_3: {
        base: 'BrowserStack',
        browser: 'Mobile Safari',
        browser_version: null,
        os: 'ios',
        os_version: '10.3',
        real_mobile: false,
        device: 'iPhone SE'
      },
      bs_mobile_safari_11_2: {
        base: 'BrowserStack',
        browser: 'Mobile Safari',
        browser_version: null,
        os: 'ios',
        os_version: '11.2',
        real_mobile: true,
        device: 'iPhone SE'
      },
      bs_android_mobile: {
        base: 'BrowserStack',
        browser: 'Android Browser',
        browser_version: null,
        os: 'android',
        os_version: '8.0',
        real_mobile: true,
        device: 'Google Pixel'
      },
      bs_win10_opera_41: {
        base: 'BrowserStack',
        browser: 'opera',
        browser_version: '41.0',
        os: 'Windows',
        os_version: '10'
      },
      FirefoxWebComponents: {
        base: 'Firefox',
        prefs: {
          'dom.webcomponents.enabled': true
        }
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
