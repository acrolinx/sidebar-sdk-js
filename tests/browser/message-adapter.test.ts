/*
 * Copyright 2019-present Acrolinx GmbH
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

import { AcrolinxSidebar } from '@acrolinx/sidebar-interface';
import { vi, expect, beforeEach, afterEach, describe, it } from 'vitest';
import { connectAcrolinxPluginToMessages, createPluginMessageAdapter } from '../../src/message-adapter/message-adapter';
import { InternalAcrolinxSidebarPluginInterface } from '../../src/internal-acrolinx-plugin';
import { addIFrame, removeEl, waitMs } from './utils/test-utils';

describe('message-adapter', () => {
  let acrolinxPlugin: InternalAcrolinxSidebarPluginInterface;
  let sidebarIFrameElement: HTMLIFrameElement;
  let evilIFrameElement: HTMLIFrameElement;
  const requestGlobalCheckMessage = { command: 'requestGlobalCheck', args: [{ selection: true, batchCheck: false }] };

  function setIFrameContent(iFrameElement: HTMLIFrameElement, message: unknown) {
    const messageJson = JSON.stringify(message);
    const contentWindow = iFrameElement.contentWindow!;
    contentWindow.document.open();
    contentWindow.document.write(`
       <script>
            var checkGlobalArgs;
            var acrolinxPlugin;

            window.acrolinxSidebar = {
              checkGlobal: function(content, opts) {
                checkGlobalArgs = [content, opts];
              }
            };

            // The timeout is needed to give test setup time to inject the createPluginMessageAdapter function.
            setTimeout(function() {
               acrolinxPlugin = createPluginMessageAdapter(window);
            }, 0);
       </script>`);
    contentWindow.document.write(`<script>window.parent.postMessage(${messageJson} ,'*')</script>`);
    contentWindow.document.close();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (contentWindow as any).createPluginMessageAdapter = createPluginMessageAdapter;
  }

  beforeEach(() => {
    sidebarIFrameElement = addIFrame();
    evilIFrameElement = addIFrame();
    acrolinxPlugin = {
      requestGlobalCheck: vi.fn(),
      requestInit: vi.fn(),
    } as unknown as InternalAcrolinxSidebarPluginInterface;
    connectAcrolinxPluginToMessages(acrolinxPlugin, sidebarIFrameElement);
  });

  afterEach(() => {
    removeEl(sidebarIFrameElement);
    removeEl(evilIFrameElement);
    vi.clearAllMocks();
  });

  describe('receive messages from Sidebar', () => {
    it('forwards messages from Sidebar', async () => {
      setIFrameContent(sidebarIFrameElement, requestGlobalCheckMessage);
      await waitMs(0);
      expect(acrolinxPlugin.requestGlobalCheck).toHaveBeenCalledWith({ selection: true, batchCheck: false });
      expect(acrolinxPlugin.requestGlobalCheck).toHaveBeenCalledTimes(1);
    });

    it('does not forward messages from other iFrames', async () => {
      setIFrameContent(evilIFrameElement, requestGlobalCheckMessage);
      await waitMs(0);
      expect(acrolinxPlugin.requestGlobalCheck).not.toHaveBeenCalled();
    });

    it('does not forward messages from current windows', async () => {
      window.postMessage(requestGlobalCheckMessage, '*');
      await waitMs(0);
      expect(acrolinxPlugin.requestGlobalCheck).not.toHaveBeenCalled();
    });

    it('injects sidebar proxy to requestInit call', async () => {
      setIFrameContent(sidebarIFrameElement, { command: 'requestInit', args: [] });
      await waitMs(0);

      expect(acrolinxPlugin.requestInit).toHaveBeenCalled();
      expect(acrolinxPlugin.requestInit).toHaveBeenCalledTimes(1);
      const [sidebarProxy] = (acrolinxPlugin.requestInit as ReturnType<typeof vi.fn>).mock.calls[0];

      expect(sidebarProxy).toHaveProperty('init');
    });
  });

  describe('send messages to Sidebar', () => {
    let sidebarProxy: AcrolinxSidebar;

    beforeEach(async () => {
      setIFrameContent(sidebarIFrameElement, { command: 'requestInit', args: [] });
      await waitMs(0);

      expect(acrolinxPlugin.requestInit).toHaveBeenCalled();
      sidebarProxy = (acrolinxPlugin.requestInit as ReturnType<typeof vi.fn>).mock.calls[0][0]!;
    });

    it('sidebar should receive messages', async () => {
      const check = sidebarProxy.checkGlobal('text', {});
      expect(typeof check.checkId).toBe('string');
      await waitMs(1);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const checkGlobalArgs = (sidebarIFrameElement.contentWindow as any).checkGlobalArgs;
      expect(checkGlobalArgs).toEqual(['text', {}]);
    });
  });
});
