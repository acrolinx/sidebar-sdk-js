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

const assert = chai.assert;
import * as _ from "lodash";

import {
  AcrolinxPlugin, AcrolinxSidebar, InitParameters, CheckOptions, Check, InvalidDocumentPart, CheckedDocumentRange,
  SidebarConfiguration, InitResult
} from '../../src/acrolinx-libs/plugin-interfaces';
import {
  MultiEditorAdapterConfig,
  AddSingleAdapterOptions,
  MultiEditorAdapter
} from "../../src/adapters/MultiEditorAdapter";
import {ContentEditableAdapter} from "../../src/adapters/ContentEditableAdapter";
import {InputAdapter} from "../../src/adapters/InputAdapter";
import * as acrolinxPluginModule from "../../src/acrolinx-plugin";
import {getMatchesWithReplacement} from "../utils/test-utils";
import {assign} from "../../src/utils/utils";
import {AcrolinxPluginConfig} from "../../src/acrolinx-plugin";

const DUMMY_CHECK_ID = 'dummyCheckId';

interface InitMultiPluginOpts {
  config?: Partial<AcrolinxPluginConfig>;
  multiEditorAdapterConfig?: MultiEditorAdapterConfig;
  addInputAdapterOptions?: AddSingleAdapterOptions;
}

describe('multi plugin', function() {
  let injectedPlugin: AcrolinxPlugin;

  let lastDocumentContent: string;
  let afterCheckCallback: Function;
  let invalidatedRanges: InvalidDocumentPart[];
  let newConfig: SidebarConfiguration;

  let acrolinxPlugin: acrolinxPluginModule.AcrolinxPlugin;

  afterEach((done) => {
    acrolinxPlugin.dispose(function() {
    });
    $('#multiPluginTest').remove();
    done();
  });

  function initMultiPlugin(done: Function, {config, addInputAdapterOptions, multiEditorAdapterConfig}: InitMultiPluginOpts = {}) {
    $('body').append(`
        <div id="multiPluginTest">
          <div id="ContentEditableAdapter" contenteditable="true">Initial text of ContentEditableAdapter.</div>
          <textarea id="InputAdapter">&lt;Initial text of InputAdapter.</textarea>
          <div id="sidebarContainer"></div>
        </div>
      `);


    const conf = assign({
      sidebarUrl: location.pathname === '/test/' ? '/test/dummy-sidebar/' : '/base/test/dummy-sidebar/',
      sidebarContainerId: 'sidebarContainer',
    }, config);

    acrolinxPlugin = new acrolinxPluginModule.AcrolinxPlugin(conf);

    const contentEditableAdapter = new ContentEditableAdapter({editorId: 'ContentEditableAdapter'});
    const inputAdapter = new InputAdapter({editorId: 'InputAdapter'});
    const multiAdapter = new MultiEditorAdapter(multiEditorAdapterConfig);
    multiAdapter.addSingleAdapter(contentEditableAdapter, addInputAdapterOptions);
    multiAdapter.addSingleAdapter(inputAdapter);

    acrolinxPlugin.registerAdapter(multiAdapter);
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
      configure(config: SidebarConfiguration): void {
        newConfig = config;
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

  function waitForCheck(callback: Function) {
    afterCheckCallback = callback;
    injectedPlugin.requestGlobalCheck();
  }


  describe('normal', () => {
    beforeEach((done) => {
      initMultiPlugin(done);
    });

    it('request check', (done) => {
      waitForCheck(() => {
        assert.equal(lastDocumentContent,
          '<div id="acrolinx_integration0">Initial text of ContentEditableAdapter.</div>' +
          '<div id="acrolinx_integration1">&lt;Initial text of InputAdapter.</div>'
        );
        done();
      });
    });

    it('selectRanges', (done) => {
      waitForCheck(() => {
        const selectedText = 'ContentEditableAdapter';
        const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');

        injectedPlugin.selectRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
        assert.equal(document.getSelection()!.toString(), selectedText);
        done();
      });
    });

    it('selectRanges in InputAdapter', (done) => {
      waitForCheck(() => {
        const selectedText = 'InputAdapter';
        const inputAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');

        injectedPlugin.selectRanges(DUMMY_CHECK_ID, inputAdapterMatch);
        const textArea = document.getElementById('InputAdapter') as HTMLTextAreaElement;
        assert.equal(textArea.value.slice(textArea.selectionStart, textArea.selectionEnd), selectedText);
        done();
      });
    });

    it('replaceRanges', (done) => {
      waitForCheck(() => {
        const textToReplace = 'ContentEditableAdapter';
        const replacement = 'ContentEditableAdapterReplacement';
        const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, textToReplace, replacement);
        injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
        assert.equal(document.getSelection()!.toString(), replacement);
        done();
      });
    });

    it('trying to select modified ranges invalidated them', (done) => {
      waitForCheck(() => {
        const selectedText = 'ContentEditableAdapter';
        const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');
        console.log(contentEditableAdapterMatch);
        $('#ContentEditableAdapter').html('Initial text of ContentEditableXAdapter.');
        injectedPlugin.selectRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
        assert.deepEqual(invalidatedRanges, [{
          checkId: DUMMY_CHECK_ID,
          range: contentEditableAdapterMatch[0].range
        }]);
        done();
      });
    });

    it('trying to replace modified ranges invalidated them', (done) => {
      waitForCheck(() => {
        const selectedText = 'ContentEditableAdapter';
        const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');
        console.log(contentEditableAdapterMatch);
        $('#ContentEditableAdapter').html('Initial text of ContentEditableXAdapter.');
        injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
        assert.deepEqual(invalidatedRanges, [{
          checkId: DUMMY_CHECK_ID,
          range: contentEditableAdapterMatch[0].range
        }]);
        done();
      });
    });

  });


  describe('with onSidebarWindowLoaded config', () => {
    const injectedStuff = 'injected';

    beforeEach((done) => {
      initMultiPlugin(done, {
        config: {
          onSidebarWindowLoaded: (sidebarWindow: Window) => {
            assert.equal(sidebarWindow, getIFrameWindow());
            (sidebarWindow as any).injectedStuff = injectedStuff;
          }
        }
      });
    });

    it('onSidebarWindowLoaded was called on sidebar window', () => {
      assert.equal((getIFrameWindow() as any).injectedStuff, injectedStuff);
    });

  });

  describe('AddSingleAdapterOptions', () => {
    it('extracted html contains additional attributes', (done) => {
      initMultiPlugin(onInitDone, {
        addInputAdapterOptions: {
          tagName: 'h1',
          attributes: {
            'class': 'class',
            'data-boolean': false,
            'data-more': '"<tag>"'
          }
        }
      });

      function onInitDone() {
        waitForCheck(() => {
          assert.equal(lastDocumentContent,
            '<h1 class="class" data-boolean="false" data-more="&quot;&lt;tag&gt;&quot;" id="acrolinx_integration0">Initial text of ContentEditableAdapter.</h1>' +
            '<div id="acrolinx_integration1">&lt;Initial text of InputAdapter.</div>'
          );
          done();
        });
      }
    });
  });

  describe('Config: documentHeader and contentElement', () => {
    it('adds documentHeader and wraps with rootElement', (done) => {
      initMultiPlugin(onInitDone, {
        multiEditorAdapterConfig: {
          documentHeader: '<!DOCTYPE html>\n',
          rootElement: {
            tagName: 'root',
          }
        }
      });

      function onInitDone() {
        waitForCheck(() => {
          const expectedBegin = '<!DOCTYPE html>\n<root>';
          assert.equal(lastDocumentContent.substr(0, expectedBegin.length), expectedBegin);
          assert.isTrue(_.endsWith(lastDocumentContent, '</root>'));
          done();
        });
      }
    });
  });

  describe('Config: beforeCheck', () => {
    it('do stuff before check', (done) => {
      initMultiPlugin(onInitDone, {
        multiEditorAdapterConfig: {
          beforeCheck: multiAdapter => {
            multiAdapter.removeAllAdapters();
            multiAdapter.addSingleAdapter(new InputAdapter({editorId: 'InputAdapter'}));
          }
        }
      });

      function onInitDone() {
        waitForCheck(() => {
          assert.equal(lastDocumentContent, '<div id="acrolinx_integration0">&lt;Initial text of InputAdapter.</div>');
          done();
        });
      }
    });
  });

  describe('configure and reconfigure', () => {
    it('configure before init done', (done) => {
      initMultiPlugin(onInitDone);
      acrolinxPlugin.configure({readOnlySuggestions: true});

      function onInitDone() {
        setTimeout(() => {
          assert.equal(newConfig.readOnlySuggestions, true);
          done();
        }, 1);
      }
    });

    it('configure later', (done) => {
      initMultiPlugin(onInitDone);

      function onInitDone() {
        setTimeout(() => {
          acrolinxPlugin.configure({readOnlySuggestions: true});
          assert.equal(newConfig.readOnlySuggestions, true);
          done();
        }, 1);
      }
    });

  });

  describe('enforce check after sidebar is initialized', () => {
    it('the check should work', (done) => {
      initMultiPlugin(_.noop, {
        config: {
          onInitFinished: (initFinishedResult: InitResult) => {
            assert.deepEqual(initFinishedResult, {});
            afterCheckCallback = () => {
              done();
            };
            acrolinxPlugin.check();
          }
        }
      });
    });
  });

});