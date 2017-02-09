"use strict";
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        //clean: {
        //    output: ["Scripts/test.js"]
        //},
        concat: {
            options: {
                sourceMap: false
            },
            dist: {
                src: ["Scripts/app/segmentationBuilder.js", "Scripts/app/expressionParser.js", "Scripts/app/employee.js"],
                dest: "Scripts/app/built.js"
            }
        },
        babel: {
            options: {
                sourceMap: false,
                presets: ["es2015"],
                plugins: ["transform-es2015-modules-commonjs"]
            },
            dist: {
                files: {
                    "Scripts/app/expressionParserEs2015.js": "Scripts/app/built.js"
                }
            }
        },
        browserify: {
            dist: {
                options: {
                    transform: [
                    ["babelify", { "presets": ["es2015"] }]]
                },
                files: {
                    "Scripts/app/expParser.js": "Scripts/app/built.js"
                }
            }
        },
        uglify: {
            my_target: {
                files: {
                    "Scripts/app/expParser.min.js": "Scripts/app/expParser.js"
                }
            }
        }
    });
    //grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-babel");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-browserify");

    grunt.registerTask("default", ["concat", "browserify"]);
    //grunt.registerTask("babelify", ["babel"]);

}