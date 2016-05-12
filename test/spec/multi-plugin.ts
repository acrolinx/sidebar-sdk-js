/// <reference path="../utils/test-utils.ts" />


namespace acrolinx.test.multiPlugin {
  import AdapterInterface = acrolinx.plugins.adapter.AdapterInterface;
  import Match = acrolinx.sidebar.Match;
  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import AdapterConf = acrolinx.plugins.adapter.AdapterConf;
  import HtmlResult = acrolinx.plugins.HtmlResult;
  import assert = chai.assert;
  import expect = chai.expect;
  import AcrolinxPlugin = acrolinx.sidebar.AcrolinxPlugin;
  import AcrolinxSidebar = acrolinx.sidebar.AcrolinxSidebar;
  import InitParameters = acrolinx.sidebar.InitParameters;
  import CheckOptions = acrolinx.sidebar.CheckOptions;
  import Check = acrolinx.sidebar.Check;
  import CheckedDocumentRange = acrolinx.sidebar.CheckedDocumentRange;
  import InvalidDocumentPart = acrolinx.sidebar.InvalidDocumentPart;
  import AcrolinxPluginConfig = acrolinx.plugins.AcrolinxPluginConfig;
  import AddSingleAdapterOptions = acrolinx.plugins.adapter.AddSingleAdapterOptions;

  const DUMMY_CHECK_ID = 'dummyCheckId';

  interface InitMultiPluginOpts {
    config?: AcrolinxPluginConfig
    addInputAdapterOptions?: AddSingleAdapterOptions
  }

  describe('multi plugin', function () {
    let injectedPlugin: AcrolinxPlugin;

    let lastDocumentContent: string;
    let afterCheckCallback: Function;
    let invalidatedRanges: InvalidDocumentPart[];

    afterEach((done) => {
      $('#multiPluginTest').remove();
      done();
    });

    function initMultiPlugin(done: Function, {config = {}, addInputAdapterOptions}: InitMultiPluginOpts = {}) {
      injectedPlugin = null;
      lastDocumentContent = null;

      $('body').append(`
        <div id="multiPluginTest">
          <div id="ContentEditableAdapter" contenteditable="true">Initial text of ContentEditableAdapter.</div>
          <textarea id="InputAdapter">&lt;Initial text of InputAdapter.</textarea>
          <div id="sidebarContainer"></div>
        </div>
      `);


      const conf = _.assign({}, {
        sidebarContainerId: 'sidebarContainer',
        sidebarUrl: location.pathname === '/test/' ? '/test/dummy-sidebar/' : '/base/test/dummy-sidebar/'
      }, config);

      const acrolinxPlugin = new acrolinx.plugins.AcrolinxPlugin(conf);
      const contentEditableAdapter = new acrolinx.plugins.adapter.ContentEditableAdapter({editorId: 'ContentEditableAdapter'});
      const inputAdapter = new acrolinx.plugins.adapter.InputAdapter({editorId: 'InputAdapter'});
      const multiAdapter = new acrolinx.plugins.adapter.MultiEditorAdapter({});
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
        init (initParameters: InitParameters): void {
          injectedPlugin.onInitFinished({});
          injectedPlugin.configure({supported: {base64EncodedGzippedDocumentContent: false}});
        },
        checkGlobal(documentContent: string, options: CheckOptions): Check {
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

        onVisibleRangesChanged(checkedDocumentRanges: CheckedDocumentRange[]) {
        }
      }
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
        })
      });

      it('selectRanges', (done) => {
        waitForCheck(() => {
          const selectedText = 'ContentEditableAdapter';
          const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, selectedText, '');

          injectedPlugin.selectRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
          assert.equal(document.getSelection().toString(), selectedText);
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
        })
      });

      it('replaceRanges', (done) => {
        waitForCheck(() => {
          const textToReplace = 'ContentEditableAdapter';
          const replacement = 'ContentEditableAdapterReplacement';
          const contentEditableAdapterMatch = getMatchesWithReplacement(lastDocumentContent, textToReplace, replacement);
          injectedPlugin.replaceRanges(DUMMY_CHECK_ID, contentEditableAdapterMatch);
          assert.equal(document.getSelection().toString(), replacement);
          done();
        })
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
        })
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
        })
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
          })
        }
      });
    });

  });
}