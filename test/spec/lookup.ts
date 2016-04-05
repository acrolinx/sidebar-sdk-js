import AdapterInterface = acrolinx.plugins.adapter.AdapterInterface;
import Match = acrolinx.sidebar.Match;
import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
import AdapterConf = acrolinx.plugins.adapter.AdapterConf;
import LookupMatchesFunction = acrolinx.plugins.lookup.LookupMatchesFunction;
var assert = chai.assert;
var expect = chai.expect;

describe('adapter test', function () {
  const lookupMatches : LookupMatchesFunction = acrolinx.plugins.lookup.diffbased.lookupMatches;

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
        var adapterConf : AdapterConf = {editorId: 'editorId', lookupMatches};
        adapter = new acrolinx.plugins.adapter[adapterName](adapterConf);
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

      function getMatchesWithReplacement(completeString: string, partialString: string, replacement: string): MatchWithReplacement[] {
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
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          assertEditorText('wordOne wordTwoReplacement wordThree');
          done();
        });
      });

      it('Replace words in reverse order', function (done) {
        givenAText('wordOne wordTwo wordThree', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'wordThreeReplacement'));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          assertEditorText('wordOne wordTwoReplacement wordThreeReplacement');
          done();
        });
      });

      it('Replace words in order', function (done) {
        givenAText('wordOne wordTwo wordThree', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'wordThreeReplacement'));
          assertEditorText('wordOne wordTwoReplacement wordThreeReplacement');
          done();
        });
      });

      it('Replace second of the same word', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', text => {
          const matchWithReplacement = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement[1]]);
          assertEditorText('wordOne wordSame wordSameReplacement wordThree');
          done();
        })
      });

      it('Replace first of the same word', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', text => {
          const matchWithReplacement = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement[0]]);
          assertEditorText('wordOne wordSameReplacement wordSame wordThree');
          done();
        });
      });

      it('Replace the same word with word in between two times with different replacements', function (done) {
        givenAText('wordOne wordSame blubb wordSame wordThree', text => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText('wordOne wordSameReplacement1 blubb wordSameReplacement2 wordThree');
          done();
        });
      });

      it('Replace the same word two times with different replacements', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', text => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText('wordOne wordSame1 wordSame2 wordThree');
          done();
        });
      })


      it('Replace the same word two times with different replacements, where the first replacement is kinda long', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', text => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSamelonglonglonglong1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText('wordOne wordSamelonglonglonglong1 wordSame2 wordThree');
          done();
        });
      });

      it('Replace the same word two times with different replacements in reverse oder', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', text => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          assertEditorText('wordOne wordSame1 wordSame2 wordThree');
          done();
        });
      });

      it('Replace single character ","', function (done) {
        givenAText('wordOne, wordTwo', text => {
          const matchWithReplacement = getMatchesWithReplacement(text, ',', '');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          assertEditorText('wordOne wordTwo');
          done();
        });
      });

      it('Replace single character space', function (done) {
        givenAText('wordOne wordTwo', text => {
          const matchWithReplacement = getMatchesWithReplacement(text, ' ', '');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          assertEditorText('wordOnewordTwo');
          done();
        });
      });

      it('Replace continues multi range', function (done) {
        givenAText('word0 blub mist word3', text => {
          const word1 = getMatchesWithReplacement(text, 'blub', "a")[0];
          const word2 = getMatchesWithReplacement(text, 'mist', "b")[0];
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

      it('Replace continues multi range with number in words', function (done) {
        givenAText('word0 blub1 mist2 word3', text => {

          const word1 = getMatchesWithReplacement(text, 'blub1', "a")[0];
          const word2 = getMatchesWithReplacement(text, 'mist2', "b")[0];
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

      it('Replace first and only char', function (done) {
        givenAText('x', text => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          assertEditorText('aa');
          done();
        });
      });

      it('Replace first and only word', function (done) {
        givenAText('xyz', text => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'xyz', 'aa'));
          assertEditorText('aa');
          done();
        });
      });

      it('Replace first char', function (done) {
        givenAText('x after', text => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          assertEditorText('aa after');
          done();
        });
      });

      it('Replace first word', function (done) {
        givenAText('xyz after', text => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'xyz', 'aa'));
          assertEditorText('aa after');
          done();
        });
      });

      it('Replace single chars', function (done) {
        givenAText('y x f z u', text => {

          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'f', 'bb'));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'z', 'cc'));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'u', 'dd'));

          assertEditorText('y aa bb cc dd');
          done();
        });
      });

      it('Replace inside a word', function (done) {
        givenAText('InsideAllWord', text => {

          const matchWithReplacement = getMatchesWithReplacement(text, 'All', '12345');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);

          assertEditorText('Inside12345Word');
          done();
        });
      });

      it('Replace last word', function (done) {
        givenAText('wordOne wordTwo', text => {

          var matchesWithReplacement = getMatchesWithReplacement(text, 'wordTwo', 'wordTw');
          adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

          assertEditorText('wordOne wordTw');
          done();
        });
      });

      it('Replace last word with short word', function (done) {
        givenAText('wordOne wordTwo', text => {

          const matchesWithReplacement = getMatchesWithReplacement(text, 'wordTwo', 'beer');
          adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

          assertEditorText('wordOne beer');
          done();
        });
      });


      it.skip('Replace discontinues multi range', function (done) {
        givenAText('wordOne wordTwo wordThree wordFour', text => {
          const matchesWithReplacement = [
            getMatchesWithReplacement(text, 'wordOne', 'a')[0],
            getMatchesWithReplacement(text, 'wordThree', 'c')[0]
          ];
          adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

          assertEditorText('a wordTwo c wordFour');
          done();
        });
      });

      it('Replace with and after strange chars', function (done) {
        givenAText('wordOne wordTwo wordThree wordFour', text => {
          const strangeChars = "[]()/&%$§\"!'*+~öäü:,;-<>|^°´`òê€@ß?={}µコンピュータ";
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', strangeChars));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'c'));
          // TODO: Depending on the document type, we should test for correct escaping.
          assertEditorText(`wordOne ${strangeChars} c wordFour`);
          done();
        });
      });

      it.skip('Replace with text looking like entities', function (done) {
        givenAText('wordOne wordTwo wordThree', text => {
          const entities = "&uuml;";
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', entities));
          assertEditorText(`wordOne ${entities} wordThree`);
          done();
        });
      });

      it.skip('Replace with text looking like html tags', function (done) {
        givenAText('wordOne wordTwo wordThree', text => {
          const replacement = "<tagish>";
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', replacement));
          assertEditorText(`wordOne ${replacement} wordThree`);
          done();
        });
      });

      it.skip('Replace word containing entity', function (done) {
        givenAText('wordOne D&amp;D wordThree', text => {
          const replacement = 'Dungeons and Dragons';
          console.log(text);
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'D&amp;D', replacement));
          assertEditorText(`wordOne ${replacement} wordThree`);
          done();
        });
      });

      it('Replace same word in correct order', function (done) {
        givenAText('before wordSame wordSame wordSame wordSame wordSame after', text => {
          const replacements = ["a", "b", "c", "d", "e"];

          function replace(i) {
            adapter.replaceRanges(dummyCheckId, [getMatchesWithReplacement(text, 'wordSame', replacements[i])[i]]);
          }

          replace(0);
          replace(4);
          replace(2);
          replace(3);
          replace(1);

          assertEditorText(`before ${replacements.join(' ')} after`);
          done();
        });
      });

      it('selectRanges does not change text', function (done) {
        const words = ['wordOne', 'wordTwo', 'wordThree', 'wordFour']
        var editorText = words.join(' ');
        givenAText(editorText, text => {
          const replacements = ["a", "b", "c", "d", "e"];

          words.forEach((word) => {
            adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(text, word, ''));
          });

          adapter.selectRanges(dummyCheckId, [
            getMatchesWithReplacement(text, words[0], "")[0],
            getMatchesWithReplacement(text, words[words.length - 1], "")[0]
          ]);

          adapter.selectRanges(dummyCheckId, [
            getMatchesWithReplacement(text, words[1], "")[0],
            getMatchesWithReplacement(text, words[2], "")[0]
          ]);

          assertEditorText(editorText);
          done();
        });
      });

    })
  })
});