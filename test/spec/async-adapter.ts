/*
 * Copyright 2018-present Acrolinx GmbH
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
import {ContentEditableAdapter} from "../../src";
import {
  AcrolinxPlugin,
  AcrolinxSidebar,
  Check,
  CheckedDocumentRange,
  CheckOptions,
  InitParameters,
  InvalidDocumentPart,
  SidebarConfiguration
} from '../../src/acrolinx-libs/plugin-interfaces';
import * as acrolinxPluginModule from "../../src/acrolinx-plugin";
import {assign} from "../../src/utils/utils";
import {getMatchesWithReplacement, waitMs} from "../utils/test-utils";
import {SlowMotionAsyncWrapper} from "./fake/SlowMotionAsyncAdapter";

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
    acrolinxPlugin.dispose(() => {
    });
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


    const conf = assign({
      sidebarUrl: location.pathname === '/test/' ? '/test/dummy-sidebar/' : '/base/test/dummy-sidebar/',
      sidebarContainerId: 'sidebarContainer',
    }, {});

    acrolinxPlugin = new acrolinxPluginModule.AcrolinxPlugin(conf);

    const slowMotionAdapter = new SlowMotionAsyncWrapper(
      new ContentEditableAdapter({editorId: 'ContentEditableAdapter'}), DELAY_IN_MS);
    acrolinxPlugin.registerAdapter(slowMotionAdapter);
    acrolinxPlugin.init();

    const pollingStartTime = Date.now();

    function pollForInjectedAcrolinxPlug() {
      const iFrameWindow = getIFrameWindow();
      if (iFrameWindow) {
        if (iFrameWindow['acrolinxPlugin']) {
          injectedPlugin = iFrameWindow['acrolinxPlugin'];
          iFrameWindow['acrolinxSidebar'] = createMockSidebar();
          injectedPlugin.requestInit();
          done();
          return;
        }
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
        injectedPlugin.configure({supported: {base64EncodedGzippedDocumentContent: false}});
      },
      configure(_config: SidebarConfiguration): void {
      },
      checkGlobal(documentContent: string, _options: CheckOptions): Check {
        lastDocumentContent = documentContent;
        setTimeout(() => {
          injectedPlugin.onCheckResult({
            checkedPart: {
              checkId: DUMMY_CHECK_ID,
              range: [0, documentContent.length]
            }
          });
          afterCheckCallback();
        }, 1);
        return {checkId: DUMMY_CHECK_ID};
      },
      onGlobalCheckRejected(): void {

      },

      invalidateRanges(invalidCheckedDocumentRanges: InvalidDocumentPart[]) {
        invalidatedRanges = invalidCheckedDocumentRanges;
      },

      onVisibleRangesChanged(_checkedDocumentRanges: CheckedDocumentRange[]) {
      },

      dispose(_callback: () => void) {
      }
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

      assert.deepEqual(invalidatedRanges, [{
        checkId: DUMMY_CHECK_ID,
        range: contentEditableAdapterMatch[0].range
      }]);
    });

    it('trying to replace modified ranges invalidated them', async () => {
      const selectedText = 'word2';
      const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');
      $('#ContentEditableAdapter').html('Modified');

      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
      assert.isUndefined(invalidatedRanges);

      await waitMs(DELAY_IN_MS);

      assert.deepEqual(invalidatedRanges, [{
        checkId: DUMMY_CHECK_ID,
        range: contentEditableAdapterMatch[0].range
      }]);
    });

    it('trying to replace modified ranges invalidated them', async () => {
      const selectedText = 'word2';
      const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');
      $('#ContentEditableAdapter').html('Modified');

      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
      assert.isUndefined(invalidatedRanges);

      await waitMs(DELAY_IN_MS);

      assert.deepEqual(invalidatedRanges, [{
        checkId: DUMMY_CHECK_ID,
        range: contentEditableAdapterMatch[0].range
      }]);
    });

    it('execute multiple requests sequentially', async () => {
      const word2Matches = getMatchesWithReplacement(lastDocumentContent, 'word2', 'word2X');
      const word3Matches = getMatchesWithReplacement(lastDocumentContent, 'word3', 'word3X');

      injectedPlugin.selectRanges(DUMMY_CHECK_ID, word3Matches);
      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, word2Matches);
      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, word3Matches);

      assert.equal(document.getSelection()!.toString(), '');

      await waitMs(DELAY_IN_MS);
      assert.equal(document.getSelection()!.toString(), 'word3');

      await waitMs(DELAY_IN_MS);
      assert.equal(document.getSelection()!.toString(), 'word2X');

      await waitMs(DELAY_IN_MS);
      assert.equal(document.getSelection()!.toString(), 'word3X');
    });

  });
});