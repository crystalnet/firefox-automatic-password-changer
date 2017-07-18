// Karma configuration
// Generated on Sun Jun 25 2017 10:10:01 GMT+0200 (Mitteleuropäische Sommerzeit)

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha', 'should'],


        // list of files / patterns to load in the browser
        files: [
            // Test dependencies
            'node_modules/ajv/dist/ajv.min.js',

            // Source
            'webextension/background-scripts/passwordGenerator.js',
            'webextension/background-scripts/player.js',
            'webextension/external-scripts/argon2.js',
            'webextension/external-scripts/salsa20.js',
            'webextension/external-scripts/argon2-asm.min.js',
            'webextension/external-scripts/lodash_throttle.min.js',

            // Tests
            'test/*.js'
        ],

        client: {
            mocha: {
                // change Karma's debug.html to the mocha web reporter
                reporter: 'html',
            },
        },


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['dots'],

        preprocessors: {
            // source files, that you wanna generate coverage for
            // do not include tests or libraries
            // (these files will be instrumented by Istanbul)
            'webextension/background-scripts/player.js': ['coverage']
        },

        junitReporter: {
            outputDir: 'shippable/testresults/', // results will be saved as $outputDir/$browserName.xml
            outputFile: 'results.xml',
            useBrowserName: false
        },

        coverageReporter: {
            type : 'cobertura',
            dir : 'shippable/codecoverage/',
            subdir: '.',
            file : 'results.xml'
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


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Firefox'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    })
}
