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
import { anything, capture, deepEqual, instance, mock, notNull, reset, verify } from 'ts-mockito';
import { InternalAcrolinxSidebarPluginInterface } from '../../src/acrolinx-plugin';
import { connectAcrolinxPluginToMessages, createPluginMessageAdapter } from '../../src/message-adapter/message-adapter';
import { addIFrame, removeEl, waitMs } from '../utils/test-utils';

const assert = chai.assert;

describe('message-adapter', function () {
  const mockedAcrolinxPlugin = mock<InternalAcrolinxSidebarPluginInterface>();
  const acrolinxPlugin = instance(mockedAcrolinxPlugin);
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
    (contentWindow as any).createPluginMessageAdapter = createPluginMessageAdapter;
  }

  beforeEach(function () {
    if (!Proxy) {
      this.skip(); // ts-mockito needs the Proxy class to mock interfaces (bad luck in IE11)
    }

    sidebarIFrameElement = addIFrame();
    evilIFrameElement = addIFrame();
    reset(mockedAcrolinxPlugin);
    connectAcrolinxPluginToMessages(acrolinxPlugin, sidebarIFrameElement);
  });

  afterEach(() => {
    removeEl(sidebarIFrameElement);
    removeEl(evilIFrameElement);
  });

  describe('receive messages from Sidebar', () => {
    it('forwards messages from Sidebar', async () => {
      setIFrameContent(sidebarIFrameElement, requestGlobalCheckMessage);
      await waitMs(0);
      verify(mockedAcrolinxPlugin.requestGlobalCheck(deepEqual({ selection: true, batchCheck: false }))).once();
    });

    it('does not forward messages from other iFrames', async () => {
      setIFrameContent(evilIFrameElement, requestGlobalCheckMessage);
      await waitMs(0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      verify(mockedAcrolinxPlugin.requestGlobalCheck(anything())).never();
    });

    it('does not forward messages from current windows', async () => {
      window.postMessage(requestGlobalCheckMessage, '*');
      await waitMs(0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      verify(mockedAcrolinxPlugin.requestGlobalCheck(anything())).never();
    });

    it('injects sidebar proxy to requestInit call', async () => {
      setIFrameContent(sidebarIFrameElement, { command: 'requestInit', args: [] });
      await waitMs(0);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      verify(mockedAcrolinxPlugin.requestInit(notNull())).once();
      const [sidebarProxy] = capture(mockedAcrolinxPlugin.requestInit).first();

      assert.isTrue('init' in sidebarProxy!);
    });
  });

  describe('send messages to Sidebar', () => {
    let sidebarProxy: AcrolinxSidebar;

    beforeEach(async () => {
      setIFrameContent(sidebarIFrameElement, { command: 'requestInit', args: [] });
      await waitMs(0);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      verify(mockedAcrolinxPlugin.requestInit(notNull())).once();
      sidebarProxy = capture(mockedAcrolinxPlugin.requestInit).first()[0]!;
    });

    it('sidebar should receive messages', async () => {
      const check = sidebarProxy.checkGlobal('text', {});
      assert.isString(check.checkId);
      await waitMs(1);

      const checkGlobalArgs = (sidebarIFrameElement.contentWindow as any).checkGlobalArgs;
      assert.deepEqual(checkGlobalArgs, ['text', {}]);
    });
  });
});
