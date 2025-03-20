/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import {
  AcrolinxPlugin,
  InvalidDocumentPart,
  AcrolinxSidebar,
  InitParameters,
  SidebarConfiguration,
  CheckOptions,
  Check,
  CheckedDocumentRange,
} from '@acrolinx/sidebar-interface';
import _ from 'lodash';
import { describe, afterEach, beforeEach, it, assert, expect } from 'vitest';
import { ContentEditableAdapter } from '../../src/adapters/content-editable-adapter';
import { getDummySidebarPath, getMatchesWithReplacement, waitMs } from './utils/test-utils';
import * as acrolinxPluginModule from '../../src/acrolinx-plugin';
import { assign } from '../../src/utils/utils';
import { SlowMotionAsyncWrapper } from './fake/slowmotion-async-adapter';
import { htmlStringToElements } from './utils/util';

const DUMMY_CHECK_ID = 'dummyCheckId';
const INITIAL_DOCUMENT_CONTENT = 'word1 word2 word3';

const DELAY_IN_MS = 50;

describe('async adapter', function () {
  let injectedPlugin: AcrolinxPlugin;

  let lastDocumentContent: string;
  let afterCheckCallback: Function;
  let invalidatedRanges: InvalidDocumentPart[] | undefined;

  let acrolinxPlugin: acrolinxPluginModule.AcrolinxPlugin;

  afterEach(() => {
    acrolinxPlugin.dispose(() => {});
    const adapter = document.getElementById('asyncAdapterTest');
    if (adapter) {
      adapter.remove();
    }
  });

  async function initAcrolinxPlugin(done: (error?: Error) => Promise<void>) {
    invalidatedRanges = undefined;

    const element = htmlStringToElements(`
        <div id="asyncAdapterTest">
          <div id="ContentEditableAdapter" contenteditable="true">${INITIAL_DOCUMENT_CONTENT}</div>
          <div id="sidebarContainer"></div>
        </div>
      `);
    document.body.appendChild(element);

    const conf = assign(
      {
        sidebarUrl: getDummySidebarPath(),
        sidebarContainerId: 'sidebarContainer',
      },
      {},
    );

    acrolinxPlugin = new acrolinxPluginModule.AcrolinxPlugin(conf);

    const slowMotionAdapter = new SlowMotionAsyncWrapper(
      new ContentEditableAdapter({ editorId: 'ContentEditableAdapter' }),
      DELAY_IN_MS,
    );
    acrolinxPlugin.registerAdapter(slowMotionAdapter);
    await acrolinxPlugin.init();
    const iFrameWindow = getIFrameWindow();
    if ((iFrameWindow as any).acrolinxPlugin) {
      injectedPlugin = (iFrameWindow as any).acrolinxPlugin;
      (iFrameWindow as any).acrolinxSidebar = createMockSidebar();
      injectedPlugin.requestInit();
      await done();
      return;
    }
  }

  function getIFrameWindow() {
    const iFrame: HTMLIFrameElement = document.querySelector('#sidebarContainer iframe') as HTMLIFrameElement;
    return iFrame ? iFrame.contentWindow : null;
  }

  function createMockSidebar(): AcrolinxSidebar {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      init(_initParameters: InitParameters): void {
        injectedPlugin.onInitFinished({});
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      configure(_config: SidebarConfiguration): void {},
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onVisibleRangesChanged(_checkedDocumentRanges: CheckedDocumentRange[]) {},

      showMessage: _.noop,
    };
  }

  async function waitForCheck() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, _reject) => {
      afterCheckCallback = resolve;
      injectedPlugin.requestGlobalCheck();
    });
  }

  describe('synchronize async adapter', () => {
    beforeEach(async () => {
      await initAcrolinxPlugin(async () => {
        await waitForCheck();
      });
    });

    it('request check', async () => {
      expect(lastDocumentContent).toEqual(INITIAL_DOCUMENT_CONTENT);
    });

    it('selectRanges', async () => {
      const selectedText = 'word2';
      injectedPlugin.selectRanges(DUMMY_CHECK_ID, getMatchesWithReplacement(lastDocumentContent, selectedText, ''));
      await waitMs(DELAY_IN_MS);
      expect(document.getSelection()!.toString()).toEqual(selectedText);
    });

    it('replaceRanges', async () => {
      const replacement = 'replacement';
      const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, 'word2', replacement);

      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
      await waitMs(DELAY_IN_MS);

      expect(document.getSelection()!.toString()).toEqual(replacement);
    });

    it('trying to select modified ranges invalidated them', async () => {
      const selectedText = 'word2';
      const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');
      document.getElementById('ContentEditableAdapter')!.innerHTML = 'Modified';

      injectedPlugin.selectRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
      expect(invalidatedRanges).toBeUndefined();

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
      document.getElementById('ContentEditableAdapter')!.innerHTML = 'Modified';

      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
      expect(invalidatedRanges).toBeUndefined();

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
      document.getElementById('ContentEditableAdapter')!.innerHTML = 'Modified';

      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
      expect(invalidatedRanges).toBeUndefined();

      await waitMs(DELAY_IN_MS);

      assert.deepEqual(invalidatedRanges, [
        {
          checkId: DUMMY_CHECK_ID,
          range: contentEditableAdapterMatch[0].range,
        },
      ]);
    });

    it('execute multiple requests sequentially', async () => {
      const word2Matches = getMatchesWithReplacement(lastDocumentContent, 'word2', 'word2X');
      const word3Matches = getMatchesWithReplacement(lastDocumentContent, 'word3', 'word3X');

      injectedPlugin.selectRanges(DUMMY_CHECK_ID, word3Matches);
      await waitMs(DELAY_IN_MS);
      expect(document.getSelection()!.toString()).toEqual('word3');

      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, word2Matches);
      await waitMs(DELAY_IN_MS);
      expect(document.getSelection()!.toString()).toEqual('word2X');

      injectedPlugin.replaceRanges(DUMMY_CHECK_ID, word3Matches);
      await waitMs(DELAY_IN_MS);
      expect(document.getSelection()!.toString()).toEqual('word3X');
    });
  });
});
