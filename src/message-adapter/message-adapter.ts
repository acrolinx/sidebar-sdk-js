namespace acrolinx.plugins.messageAdapter {
  'use strict';
  import AcrolinxSidebar = acrolinx.sidebar.AcrolinxSidebar;
  import InitResult = acrolinx.sidebar.InitResult;
  import AcrolinxPluginConfiguration = acrolinx.sidebar.AcrolinxPluginConfiguration;
  import CheckResult = acrolinx.sidebar.CheckResult;
  import DownloadInfo = acrolinx.sidebar.DownloadInfo;
  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import InitParameters = acrolinx.sidebar.InitParameters;
  import CheckOptions = acrolinx.sidebar.CheckOptions;
  import Check = acrolinx.sidebar.Check;
  import InvalidDocumentPart = acrolinx.sidebar.InvalidDocumentPart;
  import CheckedDocumentRange = acrolinx.sidebar.CheckedDocumentRange;

  // Functions are not cloneable and don't work with postMessage.
  function removeFunctions (object: any) {
    return JSON.parse(JSON.stringify(object));
  }


  function postCommandAsMessage(window: Window, command: string, ...args: any[]) {
    window.postMessage({command,
      args: removeFunctions(args)
    }, '*');
  }

  function injectPostCommandAsMessage(window: Window, object: any) {
    for (const key in object) {
      const originalMethod = object[key];
      object[key] = (...args: any[]) => {
        postCommandAsMessage(window, key, ...args);
        return originalMethod.apply(object, args);
      };
    }
  }

  /**
   * Connects to a sidebar iframe that is on a different domain and uses the plugin message adapter.
   */
  export function connectAcrolinxPluginToMessages(acrolinxPlugin: acrolinx.sidebar.AcrolinxPlugin, sidebarWindowIframe: HTMLIFrameElement) {
    const acrolinxPluginAny = acrolinxPlugin as any;


    const sidebar: AcrolinxSidebar = {
      init (initParameters: InitParameters): void {
      },
      checkGlobal(documentContent: string, options: CheckOptions): Check {
        return {checkId: 'dummyCheckId'};
      },
      onGlobalCheckRejected(): void {
      },

      invalidateRanges(invalidCheckedDocumentRanges: InvalidDocumentPart[]) {
      },

      onVisibleRangesChanged(checkedDocumentRanges: CheckedDocumentRange[]) {
      }
    };

    injectPostCommandAsMessage(sidebarWindowIframe.contentWindow, sidebar);

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
  export function createPluginMessageAdapter(): acrolinx.sidebar.AcrolinxPlugin {
    const windowAny = window as any;

    function receiveMessage(event: MessageEvent) {
      const {command, args} = event.data;
      if (windowAny.acrolinxSidebar[command]) {
        windowAny.acrolinxSidebar[command].apply(windowAny.acrolinxSidebar, args);
      }
    }
    addEventListener('message', receiveMessage, false);

    const acrolinxSidebarPlugin: acrolinx.sidebar.AcrolinxPlugin = {
      requestInit () {
      },

      onInitFinished (initFinishedResult: InitResult) {
      },

      configure (configuration: AcrolinxPluginConfiguration) {
      },

      requestGlobalCheck () {
      },

      onCheckResult(checkResult: CheckResult) {
      },

      selectRanges(checkId: string, matches: MatchWithReplacement[]) {
      },

      replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
      },

      download(download: DownloadInfo) {
      },

      openWindow(urlSpec) {
      }

    };

    injectPostCommandAsMessage(window.parent, acrolinxSidebarPlugin);


    return acrolinxSidebarPlugin;

  }

}