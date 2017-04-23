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
            unitTest: {
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
        },
        watch: {
            application: {
                files: ["Scripts/app/src/*.js"],
                tasks: ["browserify:application", "uglify"],
                options: {
                    spawn: false,
                },
            },
            unitTest: {
                files: ["Scripts/app/test/src/*.js"],
                tasks: ["browserify:unitTest", "karma"],
                options: {
                    spawn: false,
                },
            }
        }
    });
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.registerTask("default", ["browserify:application", "uglify"]);
    grunt.registerTask("test", ["browserify:unitTest", "karma"]);
    grunt.registerTask("watch-test", ["watch:unitTest"]);
    grunt.registerTask("watch-application", ["watch:application"]);
};