/*eslint "quotes": [1, "single", "avoid-escape"]*/
/*global require, module*/

var fs = require('fs-extra'),
    npmPath = require('path'),
    _ = require('lodash');

module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        copy: {
            lib: {
                files: [
                    {expand: true, cwd: 'app/', src: ['**'], dest: 'build/'}
                ]
            }, package: {
                src: './package.json',
                dest: 'build/',
                options: {
                    process: function(content) {

                        // content = content.replace(/\/app(\/LiteracyStarter.html)/, '$1');
                        content = content.replace(/("toolbar":).+?(,)/, '$1' + ' false' + '$2');
                        content = content.replace(/cd.app.&&.(nw.\.)/, '$1');

                        return content;
                    }
                }
            }
        },

        watch: {
            app: {
                files: ['app/**/*', 'package.json'],
                tasks: ['copy']
            }
        },

        nwjs: {
            options: {
                platforms: ['win', 'osx64'],
                // platforms: ['win', 'osx64', 'linux'],
                // platforms: ['win'],
                buildDir: './build-native',
                version: 'v0.12.3',
                winIco: (process.platform !== 'darwin') ? './build/favicon.ico' : ''
            },
            src: ['./build/**']
        }

    });

// 3. Where we tell Grunt we plan to use this plug-in.

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-nw-builder');

// 4. Where we tell Grunt what to do when we type 'grunt' into the terminal.

    grunt.registerTask('default', ['copy']);

    grunt.registerTask('build', ['copy']);

    grunt.registerTask('build-native', ['nwjs']);

// 5. Custom tasks

    grunt.registerTask('win-exe-rename', 'Fix executable name in Windows', function() {

        var winBuildDirs = [
            npmPath.join('build-native', 'LiteracyStarter', 'win32'),
            npmPath.join('build-native', 'LiteracyStarter', 'win64')
        ];

        _.each(winBuildDirs, function(buildDir) {

            try {
                fs.renameSync(npmPath.join(buildDir, 'LiteracyStarter.exe'), npmPath.join(buildDir, 'nw.exe'));
            } catch(err) {
                grunt.log.error(err.message);
            }

        });
    });

    grunt.registerTask('win-installer-version-update', 'Update application version in installer script', function() {

        var filePaths = [
            npmPath.join('.', '32bitLiteracyStarterSetupScript.iss'),
            npmPath.join('.', '64bitLiteracyStarterSetupScript.iss')
        ];

        var packageJSON;

        try {
            packageJSON = fs.readJSONSync(npmPath.join('.', 'package.JSON'), {encoding: 'utf8'});
        } catch(err) {
            grunt.log.error(err.message);
        }

        var version = packageJSON.version;

        _.each(filePaths, function(filePath) {

            var contents;

            try {
                contents = fs.readFileSync(filePath, {encoding: 'utf8'});
            } catch(err) {
                grunt.log.error(err.message);
            }

            contents = contents.replace(/(MyAppVersion.*?")(?:.+?)(")/, '$1' + version + '$2');

            // console.log(contents);

            try {
                fs.writeFileSync(filePath, contents, {encoding: 'utf8'});
            } catch(err) {
                grunt.log.error(err.message);
            }

        });
    });

};
