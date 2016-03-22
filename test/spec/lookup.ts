import AdapterInterface = acrolinx.plugins.adapter.AdapterInterface;
import Match = acrolinx.sidebar.Match;
import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
var assert = chai.assert;
var expect = chai.expect;

describe('adapter test', function () {

  let adapter: AdapterInterface;

  const dummyCheckId = 'dummyCheckId';

  type DoneCallback = () => void;


  interface AdapterSpec {
    name: string;
    editorElement: string;
    setEditorContent: (text: string, done: DoneCallback) => void;
    init?: (done: DoneCallback) => void;
    remove: () => void;
  }

  const adapters: AdapterSpec[] = [
    {
      name: 'ContentEditableAdapter',
      editorElement: '<div id="editorId" contenteditable="true">initial text</div>',
      setEditorContent: (html: string, done: DoneCallback) => {
        $('#editorId').html(html);
        done();
      },
      remove: () => {
        $('#editorId').remove();
      }
    },
    {
      name: 'InputAdapter',
      editorElement: '<textarea id="editorId">initial text</textarea>',
      setEditorContent: (html: string, done: DoneCallback) => {
        $('#editorId').val(html);
        done();
      },
      remove: () => {
        $('#editorId').remove();
      }
    },
    {
      name: 'CKEditorAdapter',
      editorElement: '<textarea name="editorId" id="editorId" rows="10" cols="40">initial text</textarea>',
      setEditorContent: (html: string, done: DoneCallback) => {
        CKEDITOR.instances['editorId'].setData(html, () => {
          done();
        });
      },
      init: (done: DoneCallback) => {
        this.orginialRangyGetSelection = rangy.getSelection;
        /**
         * Simple replacement for rangy.getSelection that avoids caching.
         * Fixes testing problem in IE.
         */
        function getSelection(doc) {
          const win: Window = rangy['dom'].getWindow(doc);
          const nativeSel = win.getSelection();
          return new rangy['Selection'](nativeSel, doc, win);
        };

        rangy.getSelection = getSelection;

        CKEDITOR.disableAutoInline = true;
        CKEDITOR.replace('editorId', {customConfig: ''});
        CKEDITOR.instances['editorId'].on("instanceReady", () => {
          // Timeout is needed for IE
          setTimeout(() => {
            done();
          }, 10);
        });
      },
      remove: () => {
        CKEDITOR.instances['editorId'].destroy(true);
        $('#editorId').remove();
        rangy.getSelection = this.orginialRangyGetSelection;
      }
    },
    {
      name: 'TinyMCEAdapter',
      editorElement: '<textarea id="editorId" rows="10" cols="40">initial text</textarea>',
      setEditorContent: (html: string, done) => {
        tinymce.get("editorId").setContent(html);
        done();
      },
      init: (done) => {
        tinymce.init({
          selector: "#editorId",
          height: 50,
          init_instance_callback: (editor) => {
            done();
          }
        });
      },
      remove: () => {
        if (tinymce) {
          tinymce.get('editorId').remove();
        }
        $('#editorId').remove();
      }
    }
  ];


  adapters.forEach(adapterSpec => {

    const adapterName = adapterSpec.name;
    describe('adapter ' + adapterName, function () {
      this.timeout(5000);

      beforeEach((done) => {
        $('body').append(adapterSpec.editorElement);
        adapter = new acrolinx.plugins.adapter[adapterName]({editorId: 'editorId'});
        if (adapterSpec.init) {
          adapterSpec.init(done);
        } else {
          done();
        }
      });

      afterEach(() => {
        adapterSpec.remove();
      });

      const setEditorContent = adapterSpec.setEditorContent;

      function assertEditorText(expectedText: string) {
        const editorContent = adapter.extractHTMLForCheck().html;
        if (adapterSpec.name === 'InputAdapter') {
          assert.equal(editorContent, expectedText);
        }
        else {
          const actualText = $('<div>' + editorContent + '</div>').text().replace('\n', '');
          assert.equal(actualText, expectedText);
        }
      }

      function getMatchWithReplacement(completeString: string, partialString: string, replacement: string): MatchWithReplacement[] {
        const matches: MatchWithReplacement[] = [];
        let offsetStart: number;
        let offsetEnd = 0;
        while (true) {
          offsetStart = completeString.indexOf(partialString, offsetEnd);

          if (offsetStart == -1) {
            break;
          }

          offsetEnd = offsetStart + partialString.length;

          matches.push({
            content: partialString,
            replacement: replacement,
            range: [offsetStart, offsetEnd]
          });
        }
        return matches;
      }


      function givenAText(text: string, callback: (text: string) => void) {
        setEditorContent(text, () => {
          adapter.registerCheckCall(dummyCheckId);
          var html = adapter.extractHTMLForCheck();
          adapter.registerCheckResult(dummyCheckId);
          callback(html.html);
        });
      }

      it('Get initial text from editor element', function () {
        assert.equal(adapter.getCurrentText(), 'initial text');
      });

      it('Get current text from editor element', function (done) {
        givenAText('current text', (text) => {
          assert.equal(adapter.getCurrentText(), 'current text');
          done();
        });
      });

      it('Extract initial HTML from editor element', function () {
        assertEditorText('initial text');
      });

      it('Extract current HTML from editor element', function (done) {
        givenAText('current text', (text) => {
          assertEditorText('current text');
          done();
        });
      });

      it('Don\'t change surrounding words when replacing', function (done) {
        givenAText('wordOne wordTwo wordThree', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          assertEditorText('wordOne wordTwoReplacement wordThree');
          done();
        });
      });

      it('Replace words in reverse order', function (done) {
        givenAText('wordOne wordTwo wordThree', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(text, 'wordThree', 'wordThreeReplacement'));
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          assertEditorText('wordOne wordTwoReplacement wordThreeReplacement');
          done();
        });
      });

      it('Replace words in order', function (done) {
        givenAText('wordOne wordTwo wordThree', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(text, 'wordThree', 'wordThreeReplacement'));
          assertEditorText('wordOne wordTwoReplacement wordThreeReplacement');
          done();
        });
      });

      it('Replace second of the same word', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', text => {
          const matchWithReplacement = getMatchWithReplacement(text, 'wordSame', 'wordSameReplacement');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement[1]]);
          assertEditorText('wordOne wordSame wordSameReplacement wordThree');
          done();
        })
      });

      it('Replace first of the same word', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', text => {
          const matchWithReplacement = getMatchWithReplacement(text, 'wordSame', 'wordSameReplacement');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement[0]]);
          assertEditorText('wordOne wordSameReplacement wordSame wordThree');
          done();
        });
      });

      it('Replace the same word with word in between two times with different replacements', function (done) {
        givenAText('wordOne wordSame blubb wordSame wordThree', text => {
          const matchWithReplacement1 = getMatchWithReplacement(text, 'wordSame', 'wordSameReplacement1');
          const matchWithReplacement2 = getMatchWithReplacement(text, 'wordSame', 'wordSameReplacement2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText('wordOne wordSameReplacement1 blubb wordSameReplacement2 wordThree');
          done();
        });
      });

      it('Replace the same word two times with different replacements', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', text => {
          const matchWithReplacement1 = getMatchWithReplacement(text, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchWithReplacement(text, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText('wordOne wordSame1 wordSame2 wordThree');
          done();
        });
      })


      it.skip('Replace the same word two times with different replacements, where the first replacement is kinda long', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', text => {
          const matchWithReplacement1 = getMatchWithReplacement(text, 'wordSame', 'wordSamelonglonglonglong1');
          const matchWithReplacement2 = getMatchWithReplacement(text, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText('wordOne wordSamelonglonglonglong1 wordSame2 wordThree');
          done();
        });
      });

      it('Replace the same word two times with different replacements in reverse oder', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', text => {
          const matchWithReplacement1 = getMatchWithReplacement(text, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchWithReplacement(text, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          assertEditorText('wordOne wordSame1 wordSame2 wordThree');
          done();
        });
      });

      it('Replace single character ","', function (done) {
        givenAText('wordOne, wordTwo', text => {
          const matchWithReplacement = getMatchWithReplacement(text, ',', '');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          assertEditorText('wordOne wordTwo');
          done();
        });
      });

      it('Replace single character space', function (done) {
        givenAText('wordOne wordTwo', text => {
          const matchWithReplacement = getMatchWithReplacement(text, ' ', '');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          assertEditorText('wordOnewordTwo');
          done();
        });
      });

      it('Replace continues multi range', function (done) {
        givenAText('word0 blub mist word3', text => {
          const word1 = getMatchWithReplacement(text, 'blub', "a")[0];
          const word2 = getMatchWithReplacement(text, 'mist', "b")[0];
          const space = {
            content: " ",
            replacement: "",
            range: [word1.range[1], word2.range[0]] as [number, number]
          };

          adapter.replaceRanges(dummyCheckId, [word1, space, word2]);
          assertEditorText('word0 ab word3');
          done();
        });
      });

      it.skip('Replace continues multi range with number in words', function (done) {
        givenAText('word0 blub1 mist2 word3', text => {

          const word1 = getMatchWithReplacement(text, 'blub1', "a")[0];
          const word2 = getMatchWithReplacement(text, 'mist2', "b")[0];
          const space = {
            content: " ",
            replacement: "",
            range: [word1.range[1], word2.range[0]] as [number, number]
          };

          adapter.replaceRanges(dummyCheckId, [word1, space, word2]);
          assertEditorText('word0 ab word3');
          done();
        });
      });

      // This fails currently in firefox and IE.
      it('Replace single chars', function (done) {
        givenAText('x f z u', text => {

          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(text, 'x', 'aa'));
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(text, 'f', 'bb'));
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(text, 'z', 'cc'));
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(text, 'u', 'dd'));

          assertEditorText('aa bb cc dd');
          done();
        });
      });

      it.skip('Replace inside a word', function (done) {
        givenAText('InsideAllWord', text => {

          var matchWithReplacement = getMatchWithReplacement(text, 'All', '12345');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);

          assertEditorText('Inside12345Word');
          done();
        });
      });

    })
  })
});
