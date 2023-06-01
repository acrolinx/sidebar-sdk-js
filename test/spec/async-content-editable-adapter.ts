/*
 * Copyright 2020-present Acrolinx GmbH
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

const assert = chai.assert;
import {
  AcrolinxPlugin,
  AcrolinxSidebar,
  Check,
  CheckedDocumentRange,
  CheckOptions,
  InitParameters,
  InvalidDocumentPart,
  SidebarConfiguration,
} from '@acrolinx/sidebar-interface';
import _ from 'lodash';
import * as acrolinxPluginModule from '../../src/acrolinx-plugin';
import { AsyncContentEditableAdapter } from '../../src/adapters/AsyncContentEditableAdapter';
import { assign } from '../../src/utils/utils';
import { getDummySidebarPath, getMatchesWithReplacement, waitMs } from '../utils/test-utils';

const DUMMY_CHECK_ID = 'dummyCheckId';
const INITIAL_DOCUMENT_CONTENT = 'word1 word2 word3';

const DELAY_IN_MS = 50;

describe('async adapter', function () {
  let injectedPlugin: AcrolinxPlugin;

  let lastDocumentContent: string;
  let afterCheckCallback: Function;
  let invalidatedRanges: InvalidDocumentPart[] | undefined;

  let acrolinxPlugin: acrolinxPluginModule.AcrolinxPlugin;

  afterEach((done) => {
    acrolinxPlugin.dispose(() => {});
    $('#asyncAdapterTest').remove();
    done();
  });

  function initAcrolinxPlugin(done: Function) {
    invalidatedRanges = undefined;

    $('body').append(`
        <div id="asyncAdapterTest">
          <div id="ContentEditableAdapter" contenteditable="true">${INITIAL_DOCUMENT_CONTENT}</div>
          <div id="sidebarContainer"></div>
        </div>
      `);

    const conf = assign(
      {
        sidebarUrl: getDummySidebarPath(),
        sidebarContainerId: 'sidebarContainer',
      },
      {},
    );

    acrolinxPlugin = new acrolinxPluginModule.AcrolinxPlugin(conf);

    const asyncContentEditableAdapter = new AsyncContentEditableAdapter({ editorId: 'ContentEditableAdapter' });
    acrolinxPlugin.registerAdapter(asyncContentEditableAdapter);
    acrolinxPlugin.init();

    const pollingStartTime = Date.now();

    function pollForInjectedAcrolinxPlug() {
      const iFrameWindow = getIFrameWindow();
      if (iFrameWindow?.['acrolinxPlugin']) {
        injectedPlugin = iFrameWindow['acrolinxPlugin'];
        iFrameWindow['acrolinxSidebar'] = createMockSidebar();
        injectedPlugin.requestInit();
        done();
        return;
      }
      if (Date.now() - pollingStartTime > 1500) {
        done(new Error("Can't find injected acrolinxPlugin"));
      } else {
        setTimeout(pollForInjectedAcrolinxPlug, 10);
      }
    }

    pollForInjectedAcrolinxPlug();
  }

  function getIFrameWindow(): any {
    const iFrame: HTMLIFrameElement = document.querySelector('#sidebarContainer iframe') as HTMLIFrameElement;
    return iFrame ? iFrame.contentWindow : null;
  }

  function createMockSidebar(): AcrolinxSidebar {
    return {
      init(_initParameters: InitParameters): void {
        injectedPlugin.onInitFinished({});
      },
      configure(_config: SidebarConfiguration): void {},
      checkGlobal(documentContent: string, _options: CheckOptions): Check {
        lastDocumentContent = documentContent;
        setTimeout(() => {
          injectedPlugin.onCheckResult({
            checkedPart: {
              checkId: DUMMY_CHECK_ID,
              range: [0, documentContent.length],
            },
          });
          afterCheckCallback();
        }, 1);
        return { checkId: DUMMY_CHECK_ID };
      },
      onGlobalCheckRejected(): void {},

      invalidateRanges(invalidCheckedDocumentRanges: InvalidDocumentPart[]) {
        invalidatedRanges = invalidCheckedDocumentRanges;
      },

      onVisibleRangesChanged(_checkedDocumentRanges: CheckedDocumentRange[]) {},

      showMessage: _.noop,
    };
  }

  async function waitForCheck() {
    return new Promise((resolve, _reject) => {
      afterCheckCallback = resolve;
      injectedPlugin.requestGlobalCheck();
    });
  }

  describe('synchronize async adapter', () => {
    beforeEach((done) => {
      initAcrolinxPlugin(() => {
        return waitForCheck().then(() => done());
      });
    });

    it('request check', async () => {
      assert.equal(lastDocumentContent, INITIAL_DOCUMENT_CONTENT);
    });

    it('selectRanges', async () => {
      const selectedText = 'word2';

      injectedPlugin.selectRanges(DUMMY_CHECK_ID, getMatchesWithReplacement(lastDocumentContent, selectedText, ''));
      await waitMs(DELAY_IN_MS);

      assert.equal(document.getSelection()!.toString(), selectedText);
    });

    it('replaceRanges', async () => {
      const replacement = 'replacement';
      const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, 'word2', replacement);

      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
      await waitMs(DELAY_IN_MS);

      assert.equal(document.getSelection()!.toString(), replacement);
    });

    it('trying to select modified ranges invalidated them', async () => {
      const selectedText = 'word2';
      const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');
      $('#ContentEditableAdapter').html('Modified');

      injectedPlugin.selectRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
      assert.isUndefined(invalidatedRanges);

      await waitMs(DELAY_IN_MS);

      assert.deepEqual(invalidatedRanges, [
        {
          checkId: DUMMY_CHECK_ID,
          range: contentEditableAdapterMatch[0].range,
        },
      ]);
    });

    it('trying to replace modified ranges invalidated them', async () => {
      const selectedText = 'word2';
      const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');
      $('#ContentEditableAdapter').html('Modified');

      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
      assert.isUndefined(invalidatedRanges);

      await waitMs(DELAY_IN_MS);

      assert.deepEqual(invalidatedRanges, [
        {
          checkId: DUMMY_CHECK_ID,
          range: contentEditableAdapterMatch[0].range,
        },
      ]);
    });

    it('trying to replace modified ranges invalidated them', async () => {
      const selectedText = 'word2';
      const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');
      $('#ContentEditableAdapter').html('Modified');

      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
      assert.isUndefined(invalidatedRanges);

      await waitMs(DELAY_IN_MS);

      assert.deepEqual(invalidatedRanges, [
        {
          checkId: DUMMY_CHECK_ID,
          range: contentEditableAdapterMatch[0].range,
        },
      ]);
    });
  });
});
