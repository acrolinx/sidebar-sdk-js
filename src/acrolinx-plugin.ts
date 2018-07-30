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
import * as acrolinxSidebarInterfaces from './acrolinx-libs/plugin-interfaces';
import {
  CheckInformationKeyValuePair,
  InitParameters,
  InitResult,
  OpenWindowParameters,
  RequestGlobalCheckOptions,
  SidebarConfiguration,
  CheckResult
} from './acrolinx-libs/plugin-interfaces';
import {AdapterInterface, ContentExtractionResult, hasError} from "./adapters/AdapterInterface";
import {AutoBindAdapter} from "./adapters/AutoBindAdapter";
import {MultiEditorAdapterConfig} from "./adapters/MultiEditorAdapter";
import {AsyncLocalStorage, AsyncStorage} from "./floating-sidebar/async-storage";
import {FloatingSidebar, initFloatingSidebar, SIDEBAR_CONTAINER_ID} from "./floating-sidebar/floating-sidebar";
import {connectAcrolinxPluginToMessages} from "./message-adapter/message-adapter";
import {loadSidebarIntoIFrame} from "./utils/sidebar-loader";
import {assign} from "./utils/utils";

type MatchWithReplacement = acrolinxSidebarInterfaces.MatchWithReplacement;
type AcrolinxPluginConfiguration = acrolinxSidebarInterfaces.AcrolinxPluginConfiguration;
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

  /**
   * This optional function will be called after a successful check,
   * if Embed Check Data is enabled on the Acrolinx core server.
   * It’s the task of the integration to save the data in a suitable place.
   */
  onEmbedCheckData?: (checkData: CheckInformationKeyValuePair[], format: string) => void;

  onInitFinished?: (initFinishedResult: InitResult) => void;
  onCheckResult?: (checkResult: CheckResult) => void;
  openLogFile?: () => void;
  openWindow?: (url: string) => void;
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


class InternalAcrolinxSidebarPlugin implements AcrolinxSidebarPlugin {
  public acrolinxSidebar: AcrolinxSidebar;

  constructor(private config: AcrolinxPluginConfig,
              private adapter: AdapterInterface,
              private onGotSidebar: (p: InternalAcrolinxSidebarPlugin) => void,
              private sidebarContentWindow: IFrameWindowOfSidebar) {
  }

  private initSidebarOnPremise() {
    this.acrolinxSidebar.init(_.assign({}, {
      showServerSelector: true,
      clientComponents: clientComponents,
      supported: {
        checkSelection: !!this.config.checkSelection
      }
    }, this.config));
  }

  private getDefaultDocumentReference() {
    if (this.config.getDocumentReference) {
      return this.config.getDocumentReference();
    } else {
      return window.location.href;
    }
  }

  private requestGlobalCheckSync(extractionResult: ContentExtractionResult, format = 'HTML') {
    if (hasError(extractionResult)) {
      window.alert(extractionResult.error);
    } else {
      const checkInfo = this.acrolinxSidebar.checkGlobal(extractionResult.content, {
        inputFormat: format || 'HTML',
        requestDescription: {
          documentReference: extractionResult.documentReference || this.getDefaultDocumentReference()
        },
        selection: this.config.checkSelection ? extractionResult.selection : undefined
      });
      this.adapter.registerCheckCall(checkInfo);
    }
  }

  public configureSidebar(conf: SidebarConfiguration) {
    // Old versions of the sidebar may not support the configure method.
    try {
      this.acrolinxSidebar.configure(conf);
    } catch (e) {
      console.error("Error while calling sidebar.configure: ", e);
    }
  }

  requestInit(acrolinxSidebarArg?: AcrolinxSidebar) {
    this.acrolinxSidebar = acrolinxSidebarArg || this.sidebarContentWindow.acrolinxSidebar;
    this.onGotSidebar(this);
    console.log('requestInit');
    this.initSidebarOnPremise();
  }

  onInitFinished(initFinishedResult: InitResult) {
    console.log('onInitFinished: ', initFinishedResult);
    if (this.config.onInitFinished) {
      this.config.onInitFinished(initFinishedResult);
    } else if (initFinishedResult.error) {
      window.alert(initFinishedResult.error.message);
    }
  }

  configure(configuration: AcrolinxPluginConfiguration) {
    console.log('configure: ', configuration);
  }

  requestGlobalCheck(options: RequestGlobalCheckOptions = {selection: false}) {
    const adapter = this.adapter;
    const contentExtractionResultOrPromise = adapter.extractContentForCheck({checkSelection: options.selection});
    const pFormat = adapter.getFormat ? adapter.getFormat() : undefined;
    if (isPromise(contentExtractionResultOrPromise)) {
      contentExtractionResultOrPromise.then((contentExtractionResult: ContentExtractionResult) => {
        this.requestGlobalCheckSync(contentExtractionResult, pFormat);
      }).catch(error => {
        console.error('Error while adapter.extractContentForCheck:', error);
      });
    } else {
      this.requestGlobalCheckSync(contentExtractionResultOrPromise, pFormat);
    }
  }

  onCheckResult(checkResult: CheckResult) {
    if (this.config.onCheckResult) {
      this.config.onCheckResult(checkResult);
    }
    if (checkResult.embedCheckInformation && this.config.onEmbedCheckData) {
      this.config.onEmbedCheckData(checkResult.embedCheckInformation, checkResult.inputFormat || "");
    }

    // This test is needed for the sidebars < 14.7
    if (!(checkResult as any).error) {
      this.adapter.registerCheckResult(checkResult);
    }
  }

  selectRanges(checkId: string, matches: MatchWithReplacement[]) {
    console.log('selectRanges: ', checkId, matches);
    try {
      this.adapter.selectRanges(checkId, matches);
    } catch (msg) {
      console.log(msg);

      this.acrolinxSidebar.invalidateRanges(matches.map(match => ({
          checkId: checkId,
          range: match.range
        })
      ));
    }

  }

  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    console.log('replaceRanges: ', checkId, matchesWithReplacement);
    try {
      this.adapter.replaceRanges(checkId, matchesWithReplacement);
    } catch (msg) {
      console.log(msg);
      this.acrolinxSidebar.invalidateRanges(matchesWithReplacement.map(match => ({
          checkId: checkId,
          range: match.range
        })
      ));
    }
  }

  openWindow(opts: OpenWindowParameters) {
    if (this.config.openWindow) {
      this.config.openWindow(opts.url);
    } else {
      window.open(opts.url);
    }
  }

  openLogFile() {
    if (this.config.openLogFile) {
      this.config.openLogFile();
    }
  }
}

function initInternalAcrolinxSidebarPlugin(config: AcrolinxPluginConfig, editorAdapter: AdapterInterface, onGotSidebar: () => void): InternalAcrolinxSidebarPlugin {
  const sidebarContainer = document.getElementById(config.sidebarContainerId);

  if (!sidebarContainer) {
    throw new Error(`Acrolinx can't find an element with the configured sidebarContainerId "${config.sidebarContainerId}".`);
  }

  const sidebarIFrameElement = document.createElement('iframe') as HTMLIFrameElement;
  sidebarContainer.appendChild(sidebarIFrameElement);
  const sidebarContentWindow = sidebarIFrameElement.contentWindow as IFrameWindowOfSidebar;

  const acrolinxSidebarPlugin = new InternalAcrolinxSidebarPlugin(config, editorAdapter, onGotSidebar, sidebarContentWindow);

  function injectAcrolinxPluginInSidebar() {
    onSidebarLoaded();

    console.log('Install acrolinxPlugin in sidebar.');
    if (config.acrolinxStorage) {
      sidebarContentWindow.acrolinxStorage = config.acrolinxStorage;
    }
    sidebarContentWindow.acrolinxPlugin = acrolinxSidebarPlugin;
  }

  function loadSidebarUsingMessageAdapter() {
    console.log('Connect acrolinxPlugin in sidebar.');
    connectAcrolinxPluginToMessages(acrolinxSidebarPlugin, sidebarIFrameElement);

    loadSidebarIntoIFrame(config, sidebarIFrameElement, onSidebarLoaded);
  }

  function onSidebarLoaded() {
    if (config.onSidebarWindowLoaded) {
      config.onSidebarWindowLoaded(sidebarContentWindow);
    }
  }

  if (config.useMessageAdapter) {
    loadSidebarUsingMessageAdapter();
  } else {
    loadSidebarIntoIFrame(config, sidebarIFrameElement, injectAcrolinxPluginInSidebar);
  }

  return acrolinxSidebarPlugin;
}

export class AcrolinxPlugin {
  private readonly initConfig: AcrolinxPluginConfig;
  private adapter: AdapterInterface;
  private config: SidebarConfiguration;
  private internalPlugin: InternalAcrolinxSidebarPlugin;

  constructor(conf: AcrolinxPluginConfig) {
    this.initConfig = conf;
    this.config = {};
  }

  registerAdapter(adapter: AdapterInterface) {
    this.adapter = adapter;
  }

  configure(conf: SidebarConfiguration) {
    this.config = _.assign(this.config, conf);
    // TODO: Move the this whole method into the internal plugin?
    if (this.internalPlugin.acrolinxSidebar) {
      this.internalPlugin.configureSidebar(this.config);
    }
  }

  check() {
    if (this.internalPlugin) {
      this.internalPlugin.requestGlobalCheck();
    }
  }

  init() {
    this.internalPlugin = initInternalAcrolinxSidebarPlugin(this.initConfig, this.adapter, () => {
      this.internalPlugin.configureSidebar(this.config);
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