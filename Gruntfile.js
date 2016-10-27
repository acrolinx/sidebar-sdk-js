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
const FS = require("q-io/fs");
const serveStatic = require('serve-static');
const dts = require('dts-bundle');


module.exports = function (grunt) {
  var name = 'acrolinx-sidebar-integration';
  var version = '';

  var grunt_config = {
    watch: {
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          'src/**/*', 'distrib/**/*', 'samples/**/*', 'test/**/*'
        ]
      },
      tslint: {
        options: {atBegin: true},
        files: ['src/**/*.ts', 'tslint.json'],
        tasks: ['tslint']
      },
      ts: {
        options: {atBegin: true},
        files: ['src/**/*.ts', 'test/**/*.ts'],
        tasks: ['ts:all', 'browserify'],
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
              connect().use('/', serveStatic('./samples')),
              connect().use('/tmp', serveStatic('tmp')),
              connect().use('/test', serveStatic('./test')),
              connect().use('/distrib', serveStatic('./distrib')),
              connect().use('/bower_components', serveStatic('./bower_components')),
              connect().use('/src', serveStatic('./src')),
              proxy
            ];
          }
        },
        proxies: [
          {
            context: '/sidebar',
            host: 'localhost',
            port: 9001,
            rewrite: {
              '^/sidebar': ''
            }
          },
          // {
          //   context: '/',
          //   host: 'localhost',
          //   port: 8031,
          //   // headers: {
          //   //   'username': 'admin',
          //   //   'password': 'secret'
          //   // },
          //   // rewrite: {
          //   //   '^/proxy/': '/'
          //   // }
          // }
        ]
      }
    },

    jshint: {
      myFiles: ['samples/**/*.js'],
      options: {
        jshintrc: ".jshintrc"
      }
    },

    ts: {
      all: {
        src: ['src/**/*.ts', 'test/**/*.ts'],
        dest: 'tmp/compiled/',
        tsconfig: true,
        options: {
          additionalFlags: '--strictNullChecks --noImplicitThis --noUnusedParameters --noUnusedLocals'
        }
      },
      allWithDeclarations: {
        src: ['src/**/*.ts', 'test/**/*.ts'],
        dest: 'tmp/compiled/',
        tsconfig: true,
        options: {
          additionalFlags: '--strictNullChecks --noImplicitThis --noUnusedParameters --noUnusedLocals --declaration'
        }
      }
    },

    tslint: {
      options: {
        // can be a configuration object or a filepath to tslint.json
        configuration: "tslint.json"
      },
      files: {
        src: [
          "src/**/*.ts", "!src/typings/**/*.ts"
        ]
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

    browserify: {
      distrib: {
        src: ['tmp/compiled/src/acrolinx-sidebar-integration.js'],
        dest: 'distrib/' + name + '.js'
      },
      test: {
        src: ['tmp/compiled/test/index.js'],
        dest: 'tmp/tests.js'
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
    },

    dtsGenerator: {
      options: {
        name: 'acrolinx-sidebar-integration',
        baseDir: './tmp/compiled',
        out: './dist/acrolinx-sidebar-integration.d.ts'
      },
      default: {
        src: ['tmp/compiled/**/*.d.ts']
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

  grunt.registerTask('default', ['prepareBuild', 'serve']);
  grunt.registerTask('serve', ['configureProxies:livereload', 'connect:livereload', 'watch']);
  grunt.registerTask('build', ['prepareBuild', 'tslint', 'ts:all', 'browserify']);
  grunt.registerTask('prepareBuild', ['bower:install', 'clean:distrib']);
  grunt.registerTask('distrib', ['build', 'karma:ci', 'coverage', 'uglify', 'buildDeclarations', 'clean:tsSourceMap']);

  grunt.registerTask('release', 'Release the bower project', function () {
    var done = this.async();
    FS.read('bower.json').then(function (bowerData) {
      FS.read('version').then(function (oldVersion) {
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

  grunt.registerTask('bundleDeclarations', 'Bundle the different .d.ts files into one', function () {
    dts.bundle({
      name: 'acrolinx-sidebar-integration',
      baseDir: 'tmp/compiled/src',
      main: 'tmp/compiled/src/acrolinx-sidebar-integration.d.ts',
      out: '../../../distrib/acrolinx-sidebar-integration.d.ts'
    });
  });

  grunt.registerTask('distribRelease', ['distrib', 'release']);
  grunt.registerTask('karmaLocal', ['tslint', 'karma:ci', 'coverage']);
  grunt.registerTask('typescript', ['ts:all']);
  grunt.registerTask('typescriptWithDeclarations', ['ts:allWithDeclarations']);
  grunt.registerTask('buildDeclarations', ['typescriptWithDeclarations', 'bundleDeclarations']);


};
