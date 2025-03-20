/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AcrolinxPlugin,
  InvalidDocumentPart,
  SidebarConfiguration,
  AcrolinxSidebar,
  InitParameters,
  CheckOptions,
  Check,
  CheckedDocumentRange,
  InitResult,
} from '@acrolinx/sidebar-interface';
import _, { assign } from 'lodash';
import { describe, afterEach, beforeEach, it, expect } from 'vitest';
import { AcrolinxPluginConfig } from '../../src/acrolinx-plugin-config';
import * as acrolinxPluginModule from '../../src/acrolinx-plugin';
import { ContentEditableAdapter } from '../../src/adapters/content-editable-adapter';
import { InputAdapter } from '../../src/adapters/input-adapter';
import {
  MultiEditorAdapterConfig,
  AddSingleAdapterOptions,
  MultiEditorAdapter,
} from '../../src/adapters/multi-editor-adapter';
import { getDummySidebarPath, getMatchesWithReplacement, waitMs } from './utils/test-utils';

const DUMMY_CHECK_ID = 'dummyCheckId';

interface InitMultiPluginOpts {
  config?: Partial<AcrolinxPluginConfig>;
  multiEditorAdapterConfig?: MultiEditorAdapterConfig;
  addInputAdapterOptions?: AddSingleAdapterOptions;
}

describe('multi plugin', () => {
  let injectedPlugin: AcrolinxPlugin;

  let lastDocumentContent: string;
  let invalidatedRanges: InvalidDocumentPart[];
  let newConfig: SidebarConfiguration;

  let acrolinxPlugin: acrolinxPluginModule.AcrolinxPlugin;

  afterEach(() => {
    acrolinxPlugin.dispose(_.noop);
    const element = document.getElementById('multiPluginTest');
    if (element) {
      element.remove();
    }
  });

  const initMultiPlugin = async ({
    config,
    addInputAdapterOptions,
    multiEditorAdapterConfig,
  }: InitMultiPluginOpts = {}) => {
    const body = document.body;

    const multiPluginTest = document.createElement('div');
    multiPluginTest.id = 'multiPluginTest';

    const contentEditableAdapterEle = document.createElement('div');
    contentEditableAdapterEle.id = 'ContentEditableAdapter';
    contentEditableAdapterEle.contentEditable = 'true';
    contentEditableAdapterEle.textContent = 'Initial text of ContentEditableAdapter.';

    const inputAdapterEle = document.createElement('textarea');
    inputAdapterEle.id = 'InputAdapter';
    inputAdapterEle.textContent = '<Initial text of InputAdapter.';

    const sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'sidebarContainer';

    multiPluginTest.appendChild(contentEditableAdapterEle);
    multiPluginTest.appendChild(inputAdapterEle);
    multiPluginTest.appendChild(sidebarContainer);

    body.appendChild(multiPluginTest);

    const conf = assign(
      {
        sidebarUrl: getDummySidebarPath(),
        sidebarContainerId: 'sidebarContainer',
      },
      config,
    );

    acrolinxPlugin = new acrolinxPluginModule.AcrolinxPlugin(conf);

    const contentEditableAdapter = new ContentEditableAdapter({ editorId: 'ContentEditableAdapter' });
    const inputAdapter = new InputAdapter({ editorId: 'InputAdapter' });
    const multiAdapter = new MultiEditorAdapter(multiEditorAdapterConfig);
    multiAdapter.addSingleAdapter(contentEditableAdapter, addInputAdapterOptions);
    multiAdapter.addSingleAdapter(inputAdapter);

    acrolinxPlugin.registerAdapter(multiAdapter);
    await acrolinxPlugin.init();
    const iFrameWindow = getIFrameWindow();
    if ((iFrameWindow as any).acrolinxPlugin) {
      injectedPlugin = (iFrameWindow as any).acrolinxPlugin;
      (iFrameWindow as any).acrolinxSidebar = createMockSidebar();
      injectedPlugin.requestInit();
      return;
    }
  };

  const getIFrameWindow = (): any => {
    const iFrame: HTMLIFrameElement = document.querySelector('#sidebarContainer iframe') as HTMLIFrameElement;
    return iFrame ? iFrame.contentWindow : null;
  };

  const createMockSidebar = (): AcrolinxSidebar => {
    return {
      init(_initParameters: InitParameters): void {
        injectedPlugin.onInitFinished({});
      },
      configure(config: SidebarConfiguration): void {
        newConfig = config;
      },
      checkGlobal(documentContent: string, _options: CheckOptions): Check {
        lastDocumentContent = documentContent;
        return { checkId: DUMMY_CHECK_ID };
      },
      onGlobalCheckRejected(): void {},

      invalidateRanges(invalidCheckedDocumentRanges: InvalidDocumentPart[]) {
        invalidatedRanges = invalidCheckedDocumentRanges;
      },

      onVisibleRangesChanged(_checkedDocumentRanges: CheckedDocumentRange[]) {},

      showMessage: _.noop,
    };
  };

  const waitForCheck = async (callback: () => void) => {
    injectedPlugin.requestGlobalCheck();
    await waitMs(10);

    injectedPlugin.onCheckResult({
      checkedPart: {
        checkId: DUMMY_CHECK_ID,
        range: [0, lastDocumentContent.length],
      },
    });
    callback();
  };

  describe('normal', () => {
    beforeEach(async () => {
      await initMultiPlugin();
    });

    it('request check', async () => {
      await waitForCheck(() => {
        expect(lastDocumentContent).toBe(
          '<div id="acrolinx_integration0">Initial text of ContentEditableAdapter.</div>' +
            '<div id="acrolinx_integration1">&lt;Initial text of InputAdapter.</div>',
        );
      });
    });

    it('selectRanges', async () => {
      await waitForCheck(() => {
        const selectedText = 'ContentEditableAdapter';
        const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');

        injectedPlugin.selectRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
        expect(document.getSelection()!.toString()).toBe(selectedText);
      });
    });

    it('selectRanges in InputAdapter', async () => {
      await waitForCheck(() => {
        const selectedText = 'InputAdapter';
        const inputAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');

        injectedPlugin.selectRanges(DUMMY_CHECK_ID, inputAdapterMatch);
        const textArea = document.getElementById('InputAdapter') as HTMLTextAreaElement;
        expect(textArea.value.slice(textArea.selectionStart, textArea.selectionEnd)).toBe(selectedText);
      });
    });

    it('replaceRanges', async () => {
      await waitForCheck(() => {
        const textToReplace = 'ContentEditableAdapter';
        const replacement = 'ContentEditableAdapterReplacement';
        const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, textToReplace, replacement);
        injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
        expect(document.getSelection()!.toString()).toBe(replacement);
      });
    });

    it('trying to select modified ranges invalidated them', async () => {
      await waitForCheck(() => {
        const selectedText = 'ContentEditableAdapter';
        const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');
        console.log(contentEditableAdapterMatch);
        document.getElementById('ContentEditableAdapter')!.innerHTML = 'Initial text of ContentEditableXAdapter.';
        injectedPlugin.selectRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
        expect(invalidatedRanges).toEqual([
          {
            checkId: DUMMY_CHECK_ID,
            range: contentEditableAdapterMatch[0].range,
          },
        ]);
      });
    });

    it('trying to replace modified ranges invalidated them', async () => {
      await waitForCheck(() => {
        const selectedText = 'ContentEditableAdapter';
        const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');
        console.log(contentEditableAdapterMatch);
        document.getElementById('ContentEditableAdapter')!.innerHTML = 'Initial text of ContentEditableXAdapter.';
        injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
        expect(invalidatedRanges).toEqual([
          {
            checkId: DUMMY_CHECK_ID,
            range: contentEditableAdapterMatch[0].range,
          },
        ]);
      });
    });
  });

  describe('with onSidebarWindowLoaded config', () => {
    const injectedStuff = 'injected';

    beforeEach(async () => {
      await initMultiPlugin({
        config: {
          onSidebarWindowLoaded: (sidebarWindow: Window) => {
            expect(sidebarWindow).toBe(getIFrameWindow());
            (sidebarWindow as any).injectedStuff = injectedStuff;
          },
        },
      });
    });

    it('onSidebarWindowLoaded was called on sidebar window', () => {
      expect(getIFrameWindow().injectedStuff).toBe(injectedStuff);
    });
  });

  describe('AddSingleAdapterOptions', () => {
    it('extracted html contains additional attributes', async () => {
      await initMultiPlugin({
        addInputAdapterOptions: {
          tagName: 'h1',
          attributes: {
            class: 'class',
            'data-boolean': false,
            'data-more': '"<tag>"',
          },
        },
      });

      waitForCheck(() => {
        expect(lastDocumentContent).toBe(
          '<h1 class="class" data-boolean="false" data-more="&quot;&lt;tag&gt;&quot;" id="acrolinx_integration0">Initial text of ContentEditableAdapter.</h1>' +
            '<div id="acrolinx_integration1">&lt;Initial text of InputAdapter.</div>',
        );
      });
    });
  });

  describe('Config: documentHeader and contentElement', () => {
    it('adds documentHeader and wraps with rootElement', async () => {
      await initMultiPlugin({
        multiEditorAdapterConfig: {
          documentHeader: '<!DOCTYPE html>\n',
          rootElement: {
            tagName: 'root',
          },
        },
      });

      waitForCheck(() => {
        const expectedBegin = '<!DOCTYPE html>\n<root>';
        expect(lastDocumentContent.substr(0, expectedBegin.length)).toBe(expectedBegin);
        expect(_.endsWith(lastDocumentContent, '</root>')).toBe(true);
      });
    });
  });

  describe('Config: beforeCheck', () => {
    it('do stuff before check', async () => {
      await initMultiPlugin({
        multiEditorAdapterConfig: {
          beforeCheck: (multiAdapter) => {
            multiAdapter.removeAllAdapters();
            multiAdapter.addSingleAdapter(new InputAdapter({ editorId: 'InputAdapter' }));
          },
        },
      });

      waitForCheck(() => {
        expect(lastDocumentContent).toBe('<div id="acrolinx_integration0">&lt;Initial text of InputAdapter.</div>');
      });
    });
  });

  describe('configure and reconfigure', () => {
    it('configure before init done', async () => {
      await initMultiPlugin();
      acrolinxPlugin.configure({ readOnlySuggestions: true });
      expect(newConfig.readOnlySuggestions).toBe(true);
    });

    it('configure later', async () => {
      await initMultiPlugin();
      acrolinxPlugin.configure({ readOnlySuggestions: true });
      expect(newConfig.readOnlySuggestions).toBe(true);
    });
  });

  describe('enforce check after sidebar is initialized', () => {
    it('the check should work', async () => {
      await initMultiPlugin({
        config: {
          onInitFinished: (initFinishedResult: InitResult) => {
            expect(initFinishedResult).toEqual({});
            acrolinxPlugin.check();
          },
        },
      });
    });
  });
});
