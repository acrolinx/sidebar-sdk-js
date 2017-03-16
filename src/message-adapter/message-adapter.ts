import {
  AcrolinxPlugin,
  AcrolinxSidebar,
  InitResult,
  AcrolinxPluginConfiguration,
  CheckResult,
  DownloadInfo,
  MatchWithReplacement,
  InitParameters,
  CheckOptions,
  Check,
  InvalidDocumentPart,
  CheckedDocumentRange, SidebarConfiguration
} from "../acrolinx-libs/plugin-interfaces";

// Functions are not cloneable and don't work with postMessage.
function removeFunctions(object: any) {
  return JSON.parse(JSON.stringify(object));
}


function postCommandAsMessage(window: Window, command: string, ...args: any[]) {
  window.postMessage({
    command,
    args: removeFunctions(args)
  }, '*');
}

type WindowProvider = () => Window;

function injectPostCommandAsMessage(windowProvider: WindowProvider, object: any) {
  for (const key in object) {
    const originalMethod = object[key];
    object[key] = (...args: any[]) => {
      postCommandAsMessage(windowProvider(), key, ...args);
      return originalMethod.apply(object, args);
    };
  }
}

/**
 * Connects to a sidebar iframe that is on a different domain and uses the plugin message adapter.
 */
export function connectAcrolinxPluginToMessages(acrolinxPlugin: AcrolinxPlugin, sidebarWindowIframe: HTMLIFrameElement) {
  const acrolinxPluginAny = acrolinxPlugin as any;


  const sidebar: AcrolinxSidebar = {
    init (_initParameters: InitParameters): void {
    },
    configure (_initParameters: SidebarConfiguration): void {
    },
    checkGlobal(_documentContent: string, _options: CheckOptions): Check {
      return {checkId: 'dummyCheckId'};
    },
    onGlobalCheckRejected(): void {
    },

    invalidateRanges(_invalidCheckedDocumentRanges: InvalidDocumentPart[]) {
    },

    onVisibleRangesChanged(_checkedDocumentRanges: CheckedDocumentRange[]) {
    }
  };

  injectPostCommandAsMessage(() => sidebarWindowIframe.contentWindow, sidebar);

  function receiveMessage(event: MessageEvent) {
    const {command, args} = event.data;
    if (acrolinxPluginAny[command]) {
      if (command === 'requestInit') {
        acrolinxPluginAny.requestInit(sidebar);
      } else {
        acrolinxPluginAny[command].apply(acrolinxPluginAny, args);
      }
    }
  }

  addEventListener('message', receiveMessage, false);
}

/**
 * Used inside of a sidebar iframe on a different domain.
 */
export function createPluginMessageAdapter(): AcrolinxPlugin {
  const windowAny = window as any;

  function receiveMessage(event: MessageEvent) {
    const {command, args} = event.data;
    if (windowAny.acrolinxSidebar[command]) {
      windowAny.acrolinxSidebar[command].apply(windowAny.acrolinxSidebar, args);
    }
  }

  addEventListener('message', receiveMessage, false);

  const acrolinxSidebarPlugin: AcrolinxPlugin = {
    requestInit () {
    },

    onInitFinished (_initFinishedResult: InitResult) {
    },

    configure (_configuration: AcrolinxPluginConfiguration) {
    },

    requestGlobalCheck () {
    },

    onCheckResult(_checkResult: CheckResult) {
    },

    selectRanges(_checkId: string, _matches: MatchWithReplacement[]) {
    },

    replaceRanges(_checkId: string, _matchesWithReplacement: MatchWithReplacement[]) {
    },

    download(_download: DownloadInfo) {
    },

    openWindow(_urlSpec) {
    }

  };

  injectPostCommandAsMessage(() => window.parent, acrolinxSidebarPlugin);


  return acrolinxSidebarPlugin;

}
