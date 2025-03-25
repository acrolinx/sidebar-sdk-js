/*
 * Copyright 2015-present Acrolinx GmbH
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

import { AcrolinxPlugin, AcrolinxSidebar } from '@acrolinx/sidebar-interface';
import { InternalAcrolinxSidebarPluginInterface } from '../internal-acrolinx-plugin';

// Functions are not cloneable and don't work with postMessage.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeFunctions(object: any) {
  return JSON.parse(JSON.stringify(object));
}

interface CommandMessage<I> {
  command: keyof I;
  args: unknown[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function postCommandAsMessage<T>(targetWindow: Window, command: keyof T, ...args: any[]) {
  const message: CommandMessage<T> = { command, args: removeFunctions(args) };
  targetWindow.postMessage(message, '*');
}

type WindowProvider = () => Window;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function injectPostCommandAsMessage(windowProvider: WindowProvider, object: any) {
  for (const key in object) {
    const originalMethod = object[key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object[key] = (...args: any[]) => {
      postCommandAsMessage(windowProvider(), key, ...args);
      return originalMethod.apply(object, args);
    };
  }
}

/**
 * Connects to a sidebar iframe that is on a different domain and uses the plugin message adapter.
 */
export function connectAcrolinxPluginToMessages(
  acrolinxPlugin: InternalAcrolinxSidebarPluginInterface,
  sidebarWindowIframe: HTMLIFrameElement,
) {
  const sidebar: AcrolinxSidebar = {
    init: () => {},
    configure: () => {},
    checkGlobal: () => ({ checkId: 'dummyCheckId' }),
    onGlobalCheckRejected: () => {},
    invalidateRanges: () => {},
    onVisibleRangesChanged: () => {},
    showMessage: () => {},
  };

  injectPostCommandAsMessage(() => sidebarWindowIframe.contentWindow!, sidebar);

  function receiveMessage(event: MessageEvent) {
    if (event.source !== sidebarWindowIframe.contentWindow) {
      return;
    }

    const commandMessage: CommandMessage<AcrolinxPlugin> = event.data;
    const { command, args } = commandMessage;
    if (acrolinxPlugin[command]) {
      if (command === 'requestInit') {
        acrolinxPlugin.requestInit(sidebar);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        (acrolinxPlugin[command] as Function).apply(acrolinxPlugin, args);
      }
    }
  }

  addEventListener('message', receiveMessage, false);
}

/**
 * Used inside of a sidebar iframe on a different domain.
 */
export function createPluginMessageAdapter(win = window): AcrolinxPlugin {
  function receiveMessage(event: MessageEvent) {
    const commandMessage: CommandMessage<AcrolinxSidebar> = event.data;
    const { command, args } = commandMessage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acrolinxSidebar: AcrolinxSidebar = (win as any).acrolinxSidebar;
    if (acrolinxSidebar[command]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      (acrolinxSidebar[command] as Function).apply(acrolinxSidebar, args);
    }
  }

  win.addEventListener('message', receiveMessage, false);

  const acrolinxSidebarPlugin: AcrolinxPlugin = {
    requestInit: () => {},
    onInitFinished: () => {},
    requestGlobalCheck: () => {},
    onCheckResult: () => {},
    selectRanges: () => {},
    replaceRanges: () => {},
    openWindow: () => {},
    openLogFile: () => {},
    log: () => {},
  };

  injectPostCommandAsMessage(() => win.parent, acrolinxSidebarPlugin);

  return acrolinxSidebarPlugin;
}
