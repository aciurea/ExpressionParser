"use strict";
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        browserify: {
            dist: {
                options: {
                    transform: [["babelify", { presets: ["es2015"] }]],
                    browserifyOptions: {
                        debug: true
                    }
                },
                files: {
                    "Scripts/app/dist/app.js": ["Scripts/app/src/*.js"],
                    "Scripts/test/test.js": ["Scripts/test/*.js"]
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
        }
    });
    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('jasmine-es6');
    grunt.registerTask("default", ["browserify"]);
    grunt.registerTask("test", ["jasmine"]);
};