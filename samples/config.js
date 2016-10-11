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

  //See: https://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/v0.3.37/doc/pluginDoc/interfaces/_plugin_interfaces_.initparameters.html
  serverAddress: 'http://integration.acrolinx.com:8031/',
  clientSignature: 'SW50ZWdyYXRpb25EZXZlbG9wbWVudERlbW9Pbmx5'
  //showServerSelector: true,
  //readOnlySuggestions: true,
  //sidebarUrl:'https://<LOCAL_SERVER_ADDRESS>/sidebar/v14/',

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





