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
import * as _ from "lodash";
import {Promise} from "es6-promise";
import * as acrolinxSidebarInterfaces from "./acrolinx-libs/plugin-interfaces";
import {
  RequestGlobalCheckOptions, SidebarConfiguration, CheckInformationKeyValuePair,
  InitParameters
} from "./acrolinx-libs/plugin-interfaces";
import {loadSidebarIntoIFrame} from "./utils/sidebar-loader";
import {FloatingSidebar, initFloatingSidebar, SIDEBAR_CONTAINER_ID} from "./floating-sidebar/floating-sidebar";
import {AutoBindAdapter} from "./adapters/AutoBindAdapter";
import {AdapterInterface, ContentExtractionResult, hasError} from "./adapters/AdapterInterface";
import {connectAcrolinxPluginToMessages} from "./message-adapter/message-adapter";
import {assign} from "./utils/utils";
import {AsyncLocalStorage, AsyncStorage} from "./floating-sidebar/async-storage";
import {MultiEditorAdapterConfig} from "./adapters/MultiEditorAdapter";

type DownloadInfo = acrolinxSidebarInterfaces.DownloadInfo;
type MatchWithReplacement = acrolinxSidebarInterfaces.MatchWithReplacement;
type InitResult = acrolinxSidebarInterfaces.InitResult;
type AcrolinxPluginConfiguration = acrolinxSidebarInterfaces.AcrolinxPluginConfiguration;
type CheckResult = acrolinxSidebarInterfaces.CheckResult;
type AcrolinxSidebar = acrolinxSidebarInterfaces.AcrolinxSidebar;
type AcrolinxSidebarPlugin = acrolinxSidebarInterfaces.AcrolinxPlugin;

export interface AcrolinxSimpleStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, data: string): void;
  clear(): void;
}

export interface AcrolinxPluginConfig extends InitParameters {
  sidebarContainerId: string;
  sidebarUrl?: string;
  sidebarHtml?: string;
  checkSelection?: boolean;
  useMessageAdapter?: boolean;
  useSidebarFromSameOriginDirectly?: boolean;
  onSidebarWindowLoaded?: (sidebarWindow: Window) => void;
  getDocumentReference?: () => string;
  acrolinxStorage?: AcrolinxSimpleStorage;
  onEmbedCheckData?: (checkData: CheckInformationKeyValuePair[], format: string) => void;
}

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
  acrolinxStorage?: AcrolinxSimpleStorage;
};

function initAcrolinxSamplePlugin(config: AcrolinxPluginConfig, editorAdapter: AdapterInterface): Promise<AcrolinxSidebar> {
  let resolvePromise: (sidebar: AcrolinxSidebar) => void;
  const sidebarContainer = document.getElementById(config.sidebarContainerId);

  if (!sidebarContainer) {
    throw new Error(`Acrolinx can't find an element with the configured sidebarContainerId "${config.sidebarContainerId}".`);
  }

  const sidebarIFrameElement = document.createElement('iframe') as HTMLIFrameElement;
  sidebarContainer.appendChild(sidebarIFrameElement);
  const sidebarContentWindow = sidebarIFrameElement.contentWindow as IFrameWindowOfSidebar;

  const adapter = editorAdapter;

  function createAcrolinxSidebarPlugin(): AcrolinxSidebarPlugin {
    let acrolinxSidebar: AcrolinxSidebar;

    function initSidebarOnPremise() {
      acrolinxSidebar.init(_.assign({}, {
        showServerSelector: true,
        clientComponents: clientComponents,
        supported: {
          checkSelection: !!config.checkSelection
        }
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
          },
          selection: config.checkSelection ? extractionResult.selection : undefined
        });
        adapter.registerCheckCall(checkInfo);
      }
    }

    const acrolinxSidebarPlugin: AcrolinxSidebarPlugin = {
      requestInit(acrolinxSidebarArg?: AcrolinxSidebar) {
        acrolinxSidebar = acrolinxSidebarArg || sidebarContentWindow.acrolinxSidebar;
        resolvePromise(acrolinxSidebar);
        console.log('requestInit');
        initSidebarOnPremise();
      },

      onInitFinished(initFinishedResult: InitResult) {
        console.log('onInitFinished: ', initFinishedResult);
        if (initFinishedResult.error) {
          window.alert(initFinishedResult.error.message);
        }
      },

      configure(configuration: AcrolinxPluginConfiguration) {
        console.log('configure: ', configuration);
      },

      requestGlobalCheck(options: RequestGlobalCheckOptions = {selection: false}) {
        const contentExtractionResultOrPromise = adapter.extractContentForCheck({checkSelection: options.selection});
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
        if (checkResult.embedCheckInformation && config.onEmbedCheckData) {
          config.onEmbedCheckData(checkResult.embedCheckInformation, checkResult.inputFormat || "");
        }
        return adapter.registerCheckResult(checkResult);
      },

      selectRanges(checkId: string, matches: MatchWithReplacement[]) {
        console.log('selectRanges: ', checkId, matches);
        try {
          adapter.selectRanges(checkId, matches);
        } catch (msg) {
          console.log(msg);

          acrolinxSidebar.invalidateRanges(matches.map(function(match) {
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
          acrolinxSidebar.invalidateRanges(matchesWithReplacement.map(function(match) {
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

    return acrolinxSidebarPlugin;
  }

  function injectAcrolinxPluginInSidebar() {
    const acrolinxSidebarPlugin = createAcrolinxSidebarPlugin();

    onSidebarLoaded();

    console.log('Install acrolinxPlugin in sidebar.');
    if (config.acrolinxStorage) {
      sidebarContentWindow.acrolinxStorage = config.acrolinxStorage;
    }
    sidebarContentWindow.acrolinxPlugin = acrolinxSidebarPlugin;
  }

  function loadSidebarUsingMessageAdapter() {
    const acrolinxSidebarPlugin = createAcrolinxSidebarPlugin();

    console.log('Connect acrolinxPlugin in sidebar.');
    connectAcrolinxPluginToMessages(acrolinxSidebarPlugin, sidebarIFrameElement);

    loadSidebarIntoIFrame(config, sidebarIFrameElement, onSidebarLoaded);
  }

  function onSidebarLoaded() {
    if (config.onSidebarWindowLoaded) {
      config.onSidebarWindowLoaded(sidebarContentWindow);
    }
  }

  const result = new Promise<AcrolinxSidebar>((resolve, _reject) => {
    resolvePromise = resolve;
  });

  if (config.useMessageAdapter) {
    loadSidebarUsingMessageAdapter();
  } else {
    loadSidebarIntoIFrame(config, sidebarIFrameElement, injectAcrolinxPluginInSidebar);
  }
  return result;
}


export class AcrolinxPlugin {
  private readonly initConfig: AcrolinxPluginConfig;
  private adapter: AdapterInterface;
  private config: SidebarConfiguration;
  private sidebar: AcrolinxSidebar;

  constructor(conf: AcrolinxPluginConfig) {
    this.initConfig = conf;
    this.config = {};
  }

  registerAdapter(adapter: AdapterInterface) {
    this.adapter = adapter;
  }

  configure(conf: SidebarConfiguration) {
    this.config = _.assign(this.config, conf);
    if (this.sidebar) {
      this.configureSidebar();
    }
  }

  init() {
    initAcrolinxSamplePlugin(this.initConfig, this.adapter).then(sidebar => {
      this.sidebar = sidebar;
      this.configureSidebar();
    });
  }

  dispose(callback: () => void) {
    const sidebarContainer = document.getElementById(this.initConfig.sidebarContainerId);
    if (sidebarContainer) {
      const iFrame: HTMLIFrameElement | null = sidebarContainer.querySelector('iframe');
      if (iFrame) {
        // Changing the src before cleaning the whole container is needed at least in IE 11
        // to avoid exceptions inside the iFrame caused by disappearing javascript objects.
        // The try/catch is just added to be on the safe side.
        try {
          iFrame.src = 'about:blank';
          setTimeout(() => {
            sidebarContainer.innerHTML = '';
            callback();
          }, 0);
        } catch (error) {
          console.error(error);
          callback();
        }
      } else {
        callback();
      }
    }
  }

  private configureSidebar() {
    // Old versions of the sidebar may not support the configure method.
    try {
      this.sidebar.configure(this.config);
    } catch (e) {
      console.error("Error while calling sidebar.configure: ", e);
    }
  }
}

export interface AutoBindFloatingSidebarConfig extends AcrolinxPluginConfig, MultiEditorAdapterConfig {
  asyncStorage?: AsyncStorage;
}

export function autoBindFloatingSidebar(basicConf: AutoBindFloatingSidebarConfig): FloatingSidebar {
  const conf = assign(basicConf, {
    sidebarContainerId: SIDEBAR_CONTAINER_ID,
    asyncStorage: basicConf.asyncStorage || new AsyncLocalStorage()
  });

  const floatingSidebar = initFloatingSidebar(conf);

  const acrolinxPlugin = new AcrolinxPlugin(conf);
  acrolinxPlugin.registerAdapter(new AutoBindAdapter(conf));
  acrolinxPlugin.init();

  return floatingSidebar;
}