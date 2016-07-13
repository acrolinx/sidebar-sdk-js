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


import {_} from './acrolinx-libs/acrolinx-libs-defaults';

import DownloadInfo = acrolinx.sidebar.DownloadInfo;
import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
import InitResult = acrolinx.sidebar.InitResult;
import AcrolinxPluginConfiguration = acrolinx.sidebar.AcrolinxPluginConfiguration;
import CheckResult = acrolinx.sidebar.CheckResult;
import AcrolinxSidebar = acrolinx.sidebar.AcrolinxSidebar;
import AcrolinxSidebarPlugin = acrolinx.sidebar.AcrolinxPlugin;
import AcrolinxPluginConfig = acrolinx.plugins.AcrolinxPluginConfig;
import {loadSidebarIntoIFrame} from "./utils/sidebar-loader";
import {FloatingSidebar, initFloatingSidebar, SIDEBAR_CONTAINER_ID} from "./floating-sidebar/floating-sidebar";
import {AutoBindAdapter} from "./adapters/AutoBindAdapter";
import {AdapterInterface, ContentExtractionResult, hasError} from "./adapters/AdapterInterface";
import {connectAcrolinxPluginToMessages} from "./message-adapter/message-adapter";
import {assign} from "./utils/utils";


const clientComponents = [
  {
    id: 'com.acrolinx.sidebarexample',
    name: 'Acrolinx Sidebar Example Client',
    version: '1.2.3.999',
    category: 'MAIN'
  }
];

function isPromise(result: ContentExtractionResult | Promise<ContentExtractionResult>): result is Promise<ContentExtractionResult> {
  return (<Promise<ContentExtractionResult>>result).then !== undefined;
}

type IFrameWindowOfSidebar = Window & {
  acrolinxSidebar: AcrolinxSidebar;
  acrolinxPlugin: AcrolinxSidebarPlugin;
}

function initAcrolinxSamplePlugin(config: AcrolinxPluginConfig, editorAdapter: AdapterInterface) {
  const sidebarContainer = document.getElementById(config.sidebarContainerId);

  if (!sidebarContainer) {
    throw new Error(`Acrolinx can't find an element with the configured sidebarContainerId "${config.sidebarContainerId}".`);
  }

  const sidebarIFrameElement = document.createElement('iframe') as HTMLIFrameElement;
  sidebarContainer.appendChild(sidebarIFrameElement);
  const sidebarContentWindow = sidebarIFrameElement.contentWindow as IFrameWindowOfSidebar;

  const adapter = editorAdapter;

  function onSidebarLoaded() {
    let acrolinxSidebar: AcrolinxSidebar;

    function initSidebarOnPremise() {
      acrolinxSidebar.init(_.assign({}, {
        showServerSelector: true,
        clientComponents: clientComponents
      }, config));
    }

    function getDefaultDocumentReference() {
      if (config.getDocumentReference) {
        return config.getDocumentReference();
      } else {
        return window.location.href;
      }
    }

    function requestGlobalCheckSync(extractionResult: ContentExtractionResult, format = 'HTML') {
      if (hasError(extractionResult)) {
        window.alert(extractionResult.error);
      } else {
        const checkInfo = acrolinxSidebar.checkGlobal(extractionResult.content, {
          inputFormat: format || 'HTML',
          requestDescription: {
            documentReference: extractionResult.documentReference || getDefaultDocumentReference()
          }
        });
        adapter.registerCheckCall(checkInfo);
      }
    }

    const acrolinxSidebarPlugin: acrolinx.sidebar.AcrolinxPlugin = {
      requestInit (acrolinxSidebarArg?: AcrolinxSidebar) {
        acrolinxSidebar = acrolinxSidebarArg || sidebarContentWindow.acrolinxSidebar;
        console.log('requestInit');
        initSidebarOnPremise();
      },

      onInitFinished (initFinishedResult: InitResult) {
        console.log('onInitFinished: ', initFinishedResult);
        if (initFinishedResult.error) {
          window.alert(initFinishedResult.error.message);
        }
      },

      configure (configuration: AcrolinxPluginConfiguration) {
        console.log('configure: ', configuration);
      },

      requestGlobalCheck () {
        const contentExtractionResultOrPromise = adapter.extractContentForCheck();
        const pFormat = adapter.getFormat ? adapter.getFormat() : undefined;
        if (isPromise(contentExtractionResultOrPromise)) {
          contentExtractionResultOrPromise.then((contentExtractionResult: ContentExtractionResult) => {
            requestGlobalCheckSync(contentExtractionResult, pFormat);
          });
        } else {
          requestGlobalCheckSync(contentExtractionResultOrPromise, pFormat);
        }
      },

      onCheckResult(checkResult: CheckResult) {
        return adapter.registerCheckResult(checkResult);
      },

      selectRanges(checkId: string, matches: MatchWithReplacement[]) {
        console.log('selectRanges: ', checkId, matches);
        try {
          adapter.selectRanges(checkId, matches);
        } catch (msg) {
          console.log(msg);

          acrolinxSidebar.invalidateRanges(matches.map(function (match) {
              return {
                checkId: checkId,
                range: match.range
              };
            }
          ));
        }

      },

      replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
        console.log('replaceRanges: ', checkId, matchesWithReplacement);
        try {
          adapter.replaceRanges(checkId, matchesWithReplacement);
        } catch (msg) {
          console.log(msg);
          acrolinxSidebar.invalidateRanges(matchesWithReplacement.map(function (match) {
              return {
                checkId: checkId,
                range: match.range
              };
            }
          ));
        }
      },

      download(download: DownloadInfo) {
        console.log('download: ', download.url, download);
        window.open(download.url);
      },

      openWindow({url}) {
        window.open(url);
      }

    };

    if (config.onSidebarWindowLoaded) {
      config.onSidebarWindowLoaded(sidebarContentWindow);
    }

    console.log('Install acrolinxPlugin in sidebar.');
    if (config.useMessageAdapter) {
      connectAcrolinxPluginToMessages(acrolinxSidebarPlugin, sidebarIFrameElement);
    } else {
      sidebarContentWindow.acrolinxPlugin = acrolinxSidebarPlugin;
    }
  }

  loadSidebarIntoIFrame(config, sidebarIFrameElement, onSidebarLoaded);
}


export class AcrolinxPlugin {
  config: AcrolinxPluginConfig;
  adapter: AdapterInterface;

  constructor(conf: AcrolinxPluginConfig) {
    this.config = conf;
  }

  registerAdapter(adapter: AdapterInterface) {
    this.adapter = adapter;
  }

  init() {
    initAcrolinxSamplePlugin(this.config, this.adapter);
  }
}

export function autoBindFloatingSidebar(basicConf: AcrolinxPluginConfig): FloatingSidebar {
  const conf = assign(basicConf, {
    sidebarContainerId: SIDEBAR_CONTAINER_ID
  });

  const floatingSidebar = initFloatingSidebar();

  const acrolinxPlugin = new AcrolinxPlugin(conf);
  acrolinxPlugin.registerAdapter(new AutoBindAdapter(conf));
  acrolinxPlugin.init();

  return floatingSidebar;
}