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

'use strict';
var request = require('request');
var config = require('./config').config;


if (!config.username || !config.password || !config.clientId || !config.clientSecret) {
  console.error('Please configure the cloud example in server/cloud/config.js!');
}


function handleError(response, httpStatus, message, acrolinxServerError) {
  console.error(message, httpStatus, acrolinxServerError);
  response.statusCode = httpStatus;
  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify({
    message: message,
    acrolinxServerError: acrolinxServerError
  }));
}


function newTokenHandler(req, res) {
  // The url will look like '/b26ef877-8595-4dc5-89b1-94792e9c3201'
  var contentPieceId = req.url.slice(1);

  // Here you should add some validation based on your user session.
  // ....

  // Let's get an access token from the acrolinx cloud server.
  var requestToAcrolinxServerOptions = {
    method: 'POST',
    url: 'https://acrolinx-integrations.acrolinx-cloud.com/api/v1/oauth/token',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'accept': 'application/json'
    },
    form: {
      username: config.username,
      password: config.password,
      grant_type: 'password',
      scope: 'contentpieces/' + contentPieceId + '::check',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      expires_in: 60  // duration in seconds
    }
  };

  return request(requestToAcrolinxServerOptions, function (error, acrolinxServerResponse, body) {
    if (error) {
      handleError(res, 502, "Error while connecting to the acrolinx server.", error);
      return;
    }
    if (acrolinxServerResponse.statusCode !== 200) {
      handleError(res, acrolinxServerResponse.statusCode,
        "Can't get an access token from the acrolinx server. Please configure server/cloud/config.js correctly!",
        JSON.parse(acrolinxServerResponse.body));
      return;
    }
    res.setHeader('content-type', 'text/plain');
    res.end(JSON.parse(body).access_token);
  });
}


exports.newTokenHandler = newTokenHandler;
