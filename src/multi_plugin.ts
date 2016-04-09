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

namespace acrolinx.plugins {
  'use strict';

  import AdapterInterface = acrolinx.plugins.adapter.AdapterInterface;
  import DownloadInfo = acrolinx.sidebar.DownloadInfo;
  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import InitResult = acrolinx.sidebar.InitResult;
  import AcrolinxPluginConfiguration = acrolinx.sidebar.AcrolinxPluginConfiguration;
  import CheckResult = acrolinx.sidebar.CheckResult;

  export interface  AcrolinxPluginConfig {
    sidebarContainerId?: string;
    sidebarUrl?: string;
  }

  export interface HtmlResult {
    html?: string;
    error?: any;
  }

  const clientComponents = [
    {
      id: 'com.acrolinx.sidebarexample',
      name: 'Acrolinx Sidebar Example Client',
      version: '1.2.3.999',
      category: 'MAIN'
    }
  ];

  function isPromise(result: HtmlResult | Promise<HtmlResult>): result is Promise<HtmlResult> {
    return (<Promise<HtmlResult>>result).then !== undefined;
  }

  function initAcrolinxSamplePlugin(config: AcrolinxPluginConfig, editorAdapter: AdapterInterface) {
    const $ = acrolinxLibs.$;
    const _ = acrolinxLibs._;
    const $sidebarContainer = $('#' + config.sidebarContainerId);
    const $sidebar = $('<iframe></iframe>');
    $sidebarContainer.append($sidebar);
    const sidebarContentWindow = $sidebar.get(0).contentWindow;

    const adapter = editorAdapter;

    function onSidebarLoaded() {

      function initSidebarOnPremise() {
        sidebarContentWindow.acrolinxSidebar.init(_.assign({}, {
          showServerSelector: true,
          clientComponents: clientComponents
        }, config));
      }

      function requestGlobalCheckSync(html: HtmlResult, format: string, documentReference: string) {
        if (html.hasOwnProperty('error')) {
          window.alert(html.error);
        } else {
          const checkInfo = sidebarContentWindow.acrolinxSidebar.checkGlobal(html.html, {
            inputFormat: format || 'HTML',
            requestDescription: {
              documentReference: documentReference || 'filename.html'
            }
          });
          adapter.registerCheckCall(checkInfo);
        }
      }

      const acrolinxSidebarPlugin: acrolinx.sidebar.AcrolinxPlugin = {
        requestInit () {
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
          console.log('requestGlobalCheck');
          const pHtml = adapter.extractHTMLForCheck();
          const pFormat = adapter.getFormat ? adapter.getFormat() : null;
          const pDocumentReference = adapter.getDocumentReference ? adapter.getDocumentReference() : null;
          if (isPromise(pHtml)) {
            pHtml.then((html: HtmlResult) => {
              requestGlobalCheckSync(html, pFormat, pDocumentReference);
            });
          } else {
            requestGlobalCheckSync(pHtml, pFormat, pDocumentReference);
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
            sidebarContentWindow.acrolinxSidebar.invalidateRanges(matches.map(function (match) {
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
            sidebarContentWindow.acrolinxSidebar.invalidateRanges(matchesWithReplacement.map(function (match) {
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

      console.log('Install acrolinxPlugin in sidebar.');
      sidebarContentWindow.acrolinxPlugin = acrolinxSidebarPlugin;
    }


    function loadSidebarIntoIFrame() {
      const sidebarBaseUrl = config.sidebarUrl || 'https://acrolinx-sidebar-classic.s3.amazonaws.com/v14/prod/';
      return acrolinxLibs.$.ajax({
        url: sidebarBaseUrl + 'index.html'
      }).then((sidebarHtml: string) => {
        const sidebarHtmlWithAbsoluteLinks = sidebarHtml
          .replace(/src="/g, 'src="' + sidebarBaseUrl)
          .replace(/href="/g, 'href="' + sidebarBaseUrl);
        sidebarContentWindow.document.open();
        sidebarContentWindow.document.write(sidebarHtmlWithAbsoluteLinks);
        sidebarContentWindow.document.close();
        onSidebarLoaded();
      });
    }

    loadSidebarIntoIFrame();
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


}

