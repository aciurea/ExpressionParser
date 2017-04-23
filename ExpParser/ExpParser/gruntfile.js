"use strict";
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        browserify: {
            application: {
                options: {
                    transform: [["babelify", { presets: ["es2015"] }]],
                    browserifyOptions: {
                        debug: true
                    }
                },
                files: {
                    "Scripts/app/dist/app.js": ["Scripts/app/src/*.js"]
                }
            },
            test: {
                options: {
                    transform: [["babelify", { presets: ["es2015"] }]]

                },
                files: {
                    "Scripts/app/test/dist/test.js": ["Scripts/app/test/src/*.js"]
                }
            }
        },
        uglify: {
            my_target: {
                files: {
                    "Scripts/app/dist/app.min.js": "Scripts/app/dist/app.js"
                }
            }
        },
        jasmine: {
            my_target: {
                src: "Scrips/test/test.js",
                options: {
                    specs: "Scripts/test/specTest.js",
                    helpers: ["../node_modules/babel-register/lib/node.js"]
                }
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js'
            }
        }
    });
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.registerTask("default", ["browserify:application", "uglify"]);
    grunt.registerTask("test", ["browserify:test", "karma"]);
};