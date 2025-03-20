import * as acrolinxSidebarInterfaces from '@acrolinx/sidebar-interface';
import {
  AcrolinxStorage,
  CheckResult,
  InitResult,
  LogEntry,
  Match,
  OpenWindowParameters,
  RequestGlobalCheckOptions,
  SidebarConfiguration,
} from '@acrolinx/sidebar-interface';
import { AcrolinxPluginConfig } from './acrolinx-plugin-config';
import {
  AdapterInterface,
  AsyncAdapterInterface,
  ContentExtractionResult,
  hasError,
} from './adapters/adapter-interface';
import { CLIENT_COMPONENT_MAIN_FALLBACK, SIDEBAR_SDK_COMPONENT } from './constants';
import { isPromise } from './utils/utils';
import { connectAcrolinxPluginToMessages } from './message-adapter/message-adapter';
import { loadSidebarIntoIFrame } from './utils/sidebar-loader';

type MatchWithReplacement = acrolinxSidebarInterfaces.MatchWithReplacement;
type AcrolinxSidebar = acrolinxSidebarInterfaces.AcrolinxSidebar;
type AcrolinxSidebarPlugin = acrolinxSidebarInterfaces.AcrolinxPlugin;

export type IFrameWindowOfSidebar = Window & {
  acrolinxSidebar: AcrolinxSidebar;
  acrolinxPlugin: AcrolinxSidebarPlugin;
  acrolinxStorage?: AcrolinxStorage;
};

export interface InternalAcrolinxSidebarPluginInterface extends AcrolinxSidebarPlugin {
  requestInit(acrolinxSidebarArg?: AcrolinxSidebar): void;
}

export class InternalAcrolinxSidebarPlugin implements InternalAcrolinxSidebarPluginInterface {
  public acrolinxSidebar!: AcrolinxSidebar;

  constructor(
    private config: AcrolinxPluginConfig,
    private adapter: AdapterInterface | AsyncAdapterInterface,
    private onGotSidebar: (p: InternalAcrolinxSidebarPlugin) => void,
    private sidebarContentWindow: IFrameWindowOfSidebar,
  ) {}

  private initSidebarOnPremise() {
    this.acrolinxSidebar.init({
      showServerSelector: true,
      supported: {
        checkSelection: !!this.config.checkSelection,
        log: !!this.config.log,
      },
      ...this.config,
      clientComponents: (this.config.clientComponents || CLIENT_COMPONENT_MAIN_FALLBACK).concat(SIDEBAR_SDK_COMPONENT),
    });
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
      this.acrolinxSidebar.onGlobalCheckRejected();
      window.alert(extractionResult.error);
    } else {
      const checkInfo = this.acrolinxSidebar.checkGlobal(extractionResult.content, {
        inputFormat: format || 'HTML',
        requestDescription: {
          documentReference: extractionResult.documentReference || this.getDefaultDocumentReference(),
        },
        selection: this.config.checkSelection ? extractionResult.selection : undefined,
        externalContent: extractionResult.externalContent,
      });
      this.adapter.registerCheckCall(checkInfo);
    }
  }

  public configureSidebar(conf: SidebarConfiguration) {
    // Old versions of the sidebar may not support the configure method.
    try {
      this.acrolinxSidebar.configure(conf);
    } catch (e) {
      console.error('Error while calling sidebar.configure: ', e);
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

    if (this.adapter && this.adapter.onInitFinished) {
      this.adapter.onInitFinished(initFinishedResult);
    }
  }

  requestGlobalCheck(options: RequestGlobalCheckOptions = { selection: false, batchCheck: false }) {
    const adapter = this.adapter;
    const contentExtractionResultOrPromise = adapter.extractContentForCheck({ checkSelection: options.selection });
    const pFormat = adapter.getFormat ? adapter.getFormat() : undefined;
    if (isPromise(contentExtractionResultOrPromise)) {
      contentExtractionResultOrPromise
        .then((contentExtractionResult: ContentExtractionResult) => {
          this.requestGlobalCheckSync(contentExtractionResult, pFormat);
        })
        .catch((error) => {
          this.acrolinxSidebar.onGlobalCheckRejected();
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
      this.config.onEmbedCheckData(checkResult.embedCheckInformation, checkResult.inputFormat || '');
    }

    // This test is needed for the sidebars < 14.7
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(checkResult as any).error) {
      this.adapter.registerCheckResult(checkResult);
    }
  }

  selectRanges(checkId: string, matches: Match[]) {
    console.log('selectRanges: ', checkId, matches);
    try {
      const result = this.adapter.selectRanges(checkId, matches);
      this.handlePotentialPromiseError(result, checkId, matches);
    } catch (error) {
      this.handleRangeOperationError(error, checkId, matches);
    }
  }

  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    console.log('replaceRanges: ', checkId, matchesWithReplacement);
    try {
      const result = this.adapter.replaceRanges(checkId, matchesWithReplacement);
      this.handlePotentialPromiseError(result, checkId, matchesWithReplacement);
    } catch (error) {
      this.handleRangeOperationError(error, checkId, matchesWithReplacement);
    }
  }

  private handlePotentialPromiseError(result: Promise<void> | void, checkId: string, matchesWithReplacement: Match[]) {
    if (isPromise(result)) {
      result.catch((error) => {
        this.handleRangeOperationError(error, checkId, matchesWithReplacement);
      });
    }
  }

  private handleRangeOperationError(error: unknown, checkId: string, matchesWithReplacement: Match[]) {
    console.log(error);
    this.acrolinxSidebar.invalidateRanges(
      matchesWithReplacement.map((match) => ({
        checkId: checkId,
        range: match.range,
      })),
    );
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

  log(logEntry: LogEntry): void {
    if (this.config.log) {
      this.config.log(logEntry);
    }
  }
}

export async function initInternalAcrolinxSidebarPlugin(
  config: AcrolinxPluginConfig,
  editorAdapter: AdapterInterface | AsyncAdapterInterface,
  onGotSidebar: () => void,
): Promise<InternalAcrolinxSidebarPlugin> {
  const sidebarContainer = document.getElementById(config.sidebarContainerId);

  if (!sidebarContainer) {
    throw new Error(
      `Acrolinx can't find an element with the configured sidebarContainerId "${config.sidebarContainerId}".`,
    );
  }

  const sidebarIFrameElement = document.createElement('iframe');
  sidebarContainer.appendChild(sidebarIFrameElement);
  const sidebarContentWindow = sidebarIFrameElement.contentWindow as IFrameWindowOfSidebar;

  const acrolinxSidebarPlugin = new InternalAcrolinxSidebarPlugin(
    config,
    editorAdapter,
    onGotSidebar,
    sidebarContentWindow,
  );

  function injectAcrolinxPluginInSidebar() {
    onSidebarLoaded();

    console.log('Install acrolinxPlugin in sidebar.');
    if (config.acrolinxStorage) {
      sidebarContentWindow.acrolinxStorage = config.acrolinxStorage;
    }
    sidebarContentWindow.acrolinxPlugin = acrolinxSidebarPlugin;
  }

  async function loadSidebarUsingMessageAdapter() {
    console.log('Connect acrolinxPlugin in sidebar.');
    connectAcrolinxPluginToMessages(acrolinxSidebarPlugin, sidebarIFrameElement);

    await loadSidebarIntoIFrame(config, sidebarIFrameElement, onSidebarLoaded);
  }

  function onSidebarLoaded() {
    if (config.onSidebarWindowLoaded) {
      config.onSidebarWindowLoaded(sidebarContentWindow);
    }
  }

  if (config.useMessageAdapter) {
    await loadSidebarUsingMessageAdapter();
  } else {
    await loadSidebarIntoIFrame(config, sidebarIFrameElement, injectAcrolinxPluginInSidebar);
  }

  return acrolinxSidebarPlugin;
}
