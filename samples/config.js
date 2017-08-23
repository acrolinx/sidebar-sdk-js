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

/*global initAcrolinxSamplePlugin*/

'use strict';

var basicConf = {
  sidebarContainerId: 'sidebarContainer',

  //See: https://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/v0.3.51/doc/pluginDoc/interfaces/_plugin_interfaces_.initparameters.html
  serverAddress: 'https://test-ssl.acrolinx.com/',
  clientSignature: 'SW50ZWdyYXRpb25EZXZlbG9wbWVudERlbW9Pbmx5',

  /**
   * This callback can be used to set the documentReference.
   * It is called in the moment when the document is checked.
   * The default value is window.location.href.
   * In a CMS the link to the article might be a good documentReference.
   * On other cases the full file name might be a good option.
   * @return {string}
   */
  getDocumentReference: function () {
    return window.location.href;
  },

  //clientLocale: 'en'
  //helpUrl: 'https://www.acrolinx.com',
  //showServerSelector: true,
  //readOnlySuggestions: true,
  //sidebarUrl:'https://<LOCAL_SERVER_ADDRESS>/sidebar/v14/',

  //enableSingleSignOn: true, //see: https://github.com/acrolinx/acrolinx-proxy-sample

  // clientComponents: [
  //   {
  //     id: 'com.acrolinx.sidebarexample',
  //     name: 'Acrolinx Sidebar Example Client',
  //     version: '1.2.3.999',
  //     category: 'MAIN'
  //   },
  //   {
  //     id: 'com.acrolinx.somecms',
  //     name: 'My CMS',
  //     version: '1.2.3.999'
  //   },
  //   {
  //     id: 'com.acrolinx.somelib',
  //     name: 'Referenced Lib',
  //     version: '1.0.0.0',
  //     category: 'DETAIL'
  //   },
  //   {
  //     id: 'com.acrolinx.anotherlib',
  //     name: 'Another Referenced Lib',
  //     version: '0.0.0.1',
  //     category: 'DETAIL'
  //   }
  // ]


// These settings are only effective on servers with disabled checking profiles.
  //checkSettings: {
  //  'language': 'en',
  //  'ruleSetName': 'Plain English',
  //  'termSets': ['Medical'],
  //  'checkSpelling': true,
  //  'checkGrammar': true,
  //  'checkStyle': true,
  //  'checkReuse': false,
  //  'harvestTerms': false,
  //  'checkSeo': false,
  //  'termStatuses': ['TERMINOLOGY_DEPRECATED']
  //}

  // These settings are only effective on servers with disabled checking profiles.
  //defaultCheckSettings: {
  //  'language': 'en',
  //  'ruleSetName': 'Plain English',
  //  'termSets': ['Medical'],
  //  'checkSpelling': true,
  //  'checkGrammar': true,
  //  'checkStyle': true,
  //  'checkReuse': false,
  //  'harvestTerms': false,
  //  'checkSeo': false,
  //  'termStatuses': ['TERMINOLOGY_DEPRECATED']
  //}

};





