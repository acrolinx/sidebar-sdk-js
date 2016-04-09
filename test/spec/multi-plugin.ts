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

  const DUMMY_CHECK_ID = 'dummyCheckId';



  describe('multi plugin', function () {
    let injectedPlugin: AcrolinxPlugin;

    let lastDocumentContent: string;
    let afterCheckCallback: Function;


    beforeEach((done) => {
      injectedPlugin = null;
      lastDocumentContent = null;

      $('body').append(`
        <div id="multiPluginTest">
          <div id="ContentEditableAdapter" contenteditable="true">Initial text of ContentEditableAdapter.</div>
          <textarea id="InputAdapter">Initial text of InputAdapter.</textarea>
          <div id="sidebarContainer"></div>
        </div>
      `);


      const conf = {
        sidebarContainerId: 'sidebarContainer',
        sidebarUrl: location.pathname === '/test/' ? '/test/dummy-sidebar/' : '/base/test/dummy-sidebar/'
      };

      const acrolinxPlugin = new acrolinx.plugins.AcrolinxPlugin(conf);
      const contentEditableAdapter = new acrolinx.plugins.adapter.ContentEditableAdapter({editorId: 'ContentEditableAdapter'});
      const inputAdapter = new acrolinx.plugins.adapter.InputAdapter({editorId: 'InputAdapter'});
      const multiAdapter = new acrolinx.plugins.adapter.MultiEditorAdapter({});
      multiAdapter.addSingleAdapter(contentEditableAdapter);
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
    });

    afterEach((done) => {
      $('#multiPluginTest').remove();
      done();
    });


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

        },

        onVisibleRangesChanged(checkedDocumentRanges: CheckedDocumentRange[]) {
        }
      }
    }

    function waitForCheck(callback: Function) {
      afterCheckCallback = callback;
      injectedPlugin.requestGlobalCheck();
    }


    it('request check', (done) => {
      waitForCheck(() => {
        assert.equal(lastDocumentContent,
          '<div id="acrolinx_integration0">Initial text of ContentEditableAdapter.</div>' +
          '<div id="acrolinx_integration1">Initial text of InputAdapter.</div>'
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

  });
}