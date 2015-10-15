/*
 *
 * * Copyright 2015 Acrolinx GmbH
 * *
 * * Licensed under the Apache License, Version 2.0 (the "License");
 * * you may not use this file except in compliance with the License.
 * * You may obtain a copy of the License at
 * *
 * * http://www.apache.org/licenses/LICENSE-2.0
 * *
 * * Unless required by applicable law or agreed to in writing, software
 * * distributed under the License is distributed on an "AS IS" BASIS,
 * * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * * See the License for the specific language governing permissions and
 * * limitations under the License.
 * *
 * * For more information visit: http://www.acrolinx.com
 *
 */
var FS = require("q-io/fs");

module.exports = function (grunt) {
  var exampleAuthServer = require('./samples/server/cloud/example-auth-server');
  var name = 'acrolinx-sidebar-integration';
  var version = '';

  var grunt_config = {
    watch: {
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          'src/**/*','distrib/**/*'
        ]
      },
      jshint: {
        options: {
          atBegin: true
        },
        files: ['src/**/*.js'],
        tasks: ['jshint']
      }
    },

    connect: {
      options: {
        port: 9002,
        open: false,
        livereload: 35730,
        hostname: '0.0.0.0'
      },

      livereload: {
        options: {
          middleware: function (connect) {
            var proxy = require('grunt-connect-proxy/lib/utils').proxyRequest;
            return [
              connect().use('/', connect.static('./samples/client')),
              connect().use('/distrib', connect.static('./distrib')),
              connect().use('/bower_components', connect.static('./bower_components')),
              connect().use('/token', exampleAuthServer.newTokenHandler),
              proxy
            ];
          }
        },
        proxies: []
      }
    },

    jshint: {
      myFiles: ['src/**/*.js', 'samples/**/*.js'],
      options: {
        jshintrc: ".jshintrc"
      }
    },


    concat: {
      options: {
        stripBanners:true,
        banner: "'use strict';\n",
        process: function(src, filepath) {
          return '// Source: ' + filepath + '\n' +
              src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
        }
      },
      target : {
        src : ['src/**/*.js'],
        dest : 'distrib/' + name +'.js'
      }
    },

    uglify: {
      options: {

        sourceMapRoot: '../',
        sourceMap: 'distrib/'+name+'.min.js.map',
        sourceMapUrl: name+'.min.js.map'
      },
      target : {
        src : ['src/**/*.js'],
        dest : 'distrib/' + name + '.min.js'
      }
    },

    clean: ["distrib/*"],

    bower: {
      options: {
        copy: false
      },
      install: {
        //just run 'grunt bower:install' and you'll see files from your Bower packages in lib directory
      }
    },
    shell: {
      options: {
        stderr: false
      },
      target: {
        command: 'git push origin master --tags'
      }
    }


  };

  grunt.initConfig(grunt_config);

  require('jit-grunt')(grunt, {
    bower: 'grunt-bower-task',
    configureProxies: 'grunt-connect-proxy',
    gitcommit : 'grunt-git',
    shell :'grunt-shell'
  });


  grunt.registerTask('default', ['build', 'serve']);
  grunt.registerTask('serve', ['configureProxies:livereload', 'connect:livereload', 'watch']);
  grunt.registerTask('build', ['bower:install','distrib']);
  grunt.registerTask('distrib', ['clean','concat','uglify']);

  grunt.registerTask('release','Release the bower project',function () {
    var done = this.async();
    FS.read('bower.json').then(function (bowerData) {
      FS.read('version').then(function (oldVersion) {
        var bower = JSON.parse(bowerData);

        if (bower.version != oldVersion) {
          console.log('New Version!',bower.version);
          FS.write('version',bower.version);
          version = bower.version;
          grunt.config('gitcommit', {
            task: {
              options: {
                message: 'Releasing: ' + version,
                  noVerify: true,
                  noStatus: false
              },
              files: {
                src: ['distrib/**','version']
              }
            }
          });
          grunt.config('gittag', {
            addtag: {
              options: {
                tag: 'v' + version,
                message: 'Releasing: ' + version
              }
            },
          });
          grunt.config('gitpush', {
            addtag: {
              task: {
                tags: true
              }
            },
          });
          grunt.task.run('gitcommit','gittag','shell');
          done();

        } else {
          console.log('Old Version');
          done();
        }
      });
    });
  });

  grunt.registerTask('distribRelease', ['distrib','release']);


};
