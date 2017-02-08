"use strict";
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        clean: {
            output: ["Scripts/test.js"]
        },
        babel: {
            options: {
                sourceMap: false,
                presets: ["es2015"],
                plugins:["transform-es2015-modules-commonjs"]
            },
            dist: {
                files: {
                    "Scripts/app/expressionParserEs2015.js": "Scripts/app/built.js"
                }
            }
        },
        uglify: {
            my_target: {
                files: {
                    "Scripts/app/expParser.min.js": "Scripts/app/expressionParserEs2015.js"
                }
            }
        },
        concat: {
            options: {
                sourceMap: false
            },
            dist: {
                src: ["Scripts/app/expressionParser.js", "Scripts/app/segmentationBuilder.js"],
                dest: "Scripts/app/built.js"
            }
        }
    });
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-babel");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-concat");

    grunt.registerTask("default", ["concat", "babel", "uglify"]);
    //grunt.registerTask("babelify", ["babel"]);

}