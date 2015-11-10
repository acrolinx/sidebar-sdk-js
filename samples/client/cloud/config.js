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

var acrolinxExampleConfig = {
  documentId: '',
  enableAdHocChecking: true
  //documentId: '0f7319b0-f353-45bf-9595-963e92b5d70b'
};

function requestAccessToken(documentId) {
  return $.ajax({
    url: '/token/' + documentId,
    method: 'POST'
  }).fail(function (error) {
    $('#errorMessage').show().text(JSON.stringify(error.responseJSON, null, 2));
  });
}
