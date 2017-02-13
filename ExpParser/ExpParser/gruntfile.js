"use strict";
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        babel: {
            options: {
                sourceMap: false,
                presets: ["es2015"],
                plugins: ["transform-es2015-modules-amd"]
            },
            dist: {
                files: [
                {
                    expand: true,
                    cwd: "Scripts/app/src/",
                    src: ["employee.js", "expressionParser.js", "segmentationBuilder.js", "employeeModule.js"],
                    dest: "Scripts/app/dist/"
                }]
            }
        },
        browserify: {
            dist: {
                options: {
                    transform: [
                    ["babelify", { "presets": ["es2015"] }]]
                },
                files: {
                    "Scripts/app/dist/app.js": ["Scripts/app/src/*.js"]
                }
            }
        },
        uglify: {
            my_target: {
                files: {
                    "Scripts/app/expParser.min.js": "Scripts/app/built.js"
                }
            }
        },
        transpile: {
            main: {
                type: "cjs", // or "amd" or "yui"
                files: [{
                    expand: true,
                    cwd: 'Scripts/app/src/',
                    src: ['*.js'],
                    dest: 'Scripts/app/tmp/'
                }]
            }
        }
    });
    //grunt.loadNpmTasks("grunt-babel");
    //grunt.loadNpmTasks('grunt-es6-module-transpiler');
    //grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-browserify");

    grunt.registerTask("default", ["browserify"]);
    //grunt.registerTask("default", ["concat", "babel", "browserify"]);
    //grunt.registerTask("babelJs", ["babel"]);
    //grunt.registerTask("browserifyJS", ["browserify"]);
}