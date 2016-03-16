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

module.exports = function(grunt){
  var name = 'acrolinx-sidebar-integration';
  var version = '';

  var grunt_config = {
    watch: {
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          'src/**/*', 'distrib/**/*'
        ]
      },
      jshint: {
        options: {
          atBegin: true
        },
        files: ['src/**/*.js'],
        tasks: ['jshint']
      },
      ts: {
        options: {},
        files: ['src/**/*.ts', 'test/**/*.ts'],
        tasks: ['ts']
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
          middleware: function(connect){
            var proxy = require('grunt-connect-proxy/lib/utils').proxyRequest;
            return [
              connect().use('/', connect.static('./samples/client')),
              connect().use('/tmp/compiled', connect.static('tmp/compiled')),
              connect().use('/test', connect.static('./test')),
              connect().use('/distrib', connect.static('./distrib')),
              connect().use('/bower_components', connect.static('./bower_components')),
              proxy
            ];
          }
        },
        proxies: []
      }
    },

    jshint: {
      myFiles: ['samples/**/*.js'],
      options: {
        jshintrc: ".jshintrc"
      }
    },

    ts: {
      base: {
        src: ['src/**/*.ts'],
        dest: 'distrib/' + name + '.js',
        options: {
          noImplicitAny: false,
          target: 'es5',
          sourceMap: true,
        }
      },
      test: {
        src: ['src/**/*.ts', 'test/**/*.ts'],
        dest: 'tmp/compiled/test.js',
        options: {
          target: 'es5', //or es3
          sourceMap: false
        }
      }
    },

    uglify: {
      options: {
        sourceMapRoot: '../',
        sourceMap: 'distrib/' + name + '.min.js.map',
        sourceMapUrl: name + '.min.js.map'
      },
      target: {
        src: ['distrib/' + name + '.js'],
        dest: 'distrib/' + name + '.min.js'
      }
    },

    clean: {
      distrib: {
        files: {src: ['tmp/**/*', 'distrib/**/*']}
      },
      tsSourceMap: {
        files: {src: ["distrib/acrolinx-sidebar-integration.js.map"]}
      }
    },

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
        command: 'git push --tags origin HEAD:master'
      }
    },

    karma: {
      options: {
        configFile: 'test/karma.conf.js'
      },
      ci: {
        singleRun: true,
        browsers: ['PhantomJS']
      },
      dev: {}
    },

    coverage: {
      default: {
        options: {
          thresholds: grunt.file.readJSON('.coverage.json'),
          dir: 'tmp/reports/coverage'
        }
      }
    }
  };

  grunt.initConfig(grunt_config);

  require('jit-grunt')(grunt, {
    bower: 'grunt-bower-task',
    configureProxies: 'grunt-connect-proxy',
    gitcommit: 'grunt-git',
    shell: 'grunt-shell',
    coverage: 'grunt-istanbul-coverage'
  });

  grunt.registerTask('default', ['build', 'serve']);
  grunt.registerTask('serve', ['configureProxies:livereload', 'connect:livereload', 'watch']);
  grunt.registerTask('build', ['bower:install', 'clean:distrib', 'jshint', 'ts']);
  grunt.registerTask('distrib', ['clean:distrib', 'jshint', 'ts', 'karma:ci', 'coverage', 'uglify', 'clean:tsSourceMap']);

  grunt.registerTask('release', 'Release the bower project', function(){
    var done = this.async();
    FS.read('bower.json').then(function(bowerData){
      FS.read('version').then(function(oldVersion){
        var bower = JSON.parse(bowerData);

        if (bower.version != oldVersion) {
          console.log('New Version!', bower.version);
          FS.write('version', bower.version);
          version = bower.version;
          grunt.config('gitcommit', {
            task: {
              options: {
                message: 'Releasing: ' + version,
                noVerify: true,
                noStatus: false
              },
              files: {
                src: ['distrib/**', 'version']
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
          grunt.task.run('gitcommit', 'gittag', 'shell');
          done();

        } else {
          console.log('Old Version');
          done();
        }
      });
    });
  });

  grunt.registerTask('distribRelease', ['distrib', 'release']);
  grunt.registerTask('karmaLocal', ['karma:ci', 'coverage']);

};
