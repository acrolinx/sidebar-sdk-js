/*
 * Copyright 2016-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AcrolinxPlugin,
  AcrolinxSidebar,
  InitResult,
  AcrolinxPluginConfiguration,
  CheckResult,
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
    },
    dispose(_callback: () => void) {
    }
  };

  injectPostCommandAsMessage(() => sidebarWindowIframe.contentWindow!, sidebar);

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

    openWindow(_urlSpec) {
    },

    openLogFile() {
    }

  };

  injectPostCommandAsMessage(() => window.parent, acrolinxSidebarPlugin);


  return acrolinxSidebarPlugin;

}
