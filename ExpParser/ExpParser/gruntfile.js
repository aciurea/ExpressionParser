"use strict";
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        browserify: {
            dist: {
                options: {
                    debug: true,
                    transform: [["babelify", { presets: ["es2015"] }]]
                },
                files: {
                    "Scripts/app/dist/app.js": ["Scripts/app/src/*.js"]
                }
            }
        },
        uglify: {
            my_target: {
                files: {
                    "Scripts/app/dist/app.min.js": "Scripts/app/dist/app.js"
                }
            }
        }
    });
    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.registerTask("default", ["browserify"]);
}