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

module.exports = function (grunt) {
  var exampleAuthServer = require('./server/cloud/example-auth-server');

  var grunt_config = {
    watch: {
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          'client/**/*'
        ]
      },
      jshint: {
        options: {
          atBegin: true
        },
        files: ['client/**/*.js'],
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
              connect.static('client'),
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
      myFiles: ['client/**/*.js', 'server/**/*.js'],
      options: {
        jshintrc: ".jshintrc"
      }
    },

    bower: {
      options: {
        copy: false
      },
      install: {
        //just run 'grunt bower:install' and you'll see files from your Bower packages in lib directory
      }
    }
  };

  grunt.initConfig(grunt_config);

  require('jit-grunt')(grunt, {
    bower: 'grunt-bower-task',
    configureProxies: 'grunt-connect-proxy'
  });


  grunt.registerTask('default', ['build', 'serve']);
  grunt.registerTask('serve', ['configureProxies:livereload', 'connect:livereload', 'watch']);
  grunt.registerTask('build', ['bower:install']);


};
