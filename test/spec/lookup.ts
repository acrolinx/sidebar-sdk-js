/// <reference path="../utils/test-utils.ts" />

import AdapterInterface = acrolinx.plugins.adapter.AdapterInterface;
import Match = acrolinx.sidebar.Match;
import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
import AdapterConf = acrolinx.plugins.adapter.AdapterConf;
import HtmlResult = acrolinx.plugins.HtmlResult;
import editor = CKEDITOR.editor;
import getMatchesWithReplacement = acrolinx.test.utils.getMatchesWithReplacement;
import enableLogging = acrolinx.plugins.utils.enableLogging;
var assert = chai.assert;
var expect = chai.expect;

describe('adapter test', function () {
  const NON_BREAKING_SPACE = '\u00a0';

  let adapter: AdapterInterface;

  const dummyCheckId = 'dummyCheckId';

  type DoneCallback = () => void;


  interface AdapterSpec {
    name: string;
    editorElement: string;
    inputFormat: string;
    setEditorContent: (text: string, done: DoneCallback) => void;
    init?: (done: DoneCallback) => void;
    remove: () => void;
  }

  function getCkEditorInstance(id: string): editor {
    return CKEDITOR.instances[id];
  }

  const adapters: AdapterSpec[] = [
    {
      name: 'ContentEditableAdapter',
      inputFormat: 'HTML',
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
      inputFormat: 'TEXT',
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
      inputFormat: 'HTML',
      editorElement: '<textarea name="editorId" id="editorId" rows="10" cols="40">initial text</textarea>',
      setEditorContent: (html: string, done: DoneCallback) => {
        getCkEditorInstance('editorId').setData(html, () => {
          done();
        });
      },
      init: (done: DoneCallback) => {
        CKEDITOR.disableAutoInline = true;
        CKEDITOR.replace('editorId', {customConfig: ''});
        getCkEditorInstance('editorId').on("instanceReady", () => {
          // Timeout is needed for IE
          setTimeout(() => {
            done();
          }, 10);
        });
      },
      remove: () => {
        getCkEditorInstance('editorId').destroy(true);
        $('#editorId').remove();
      }
    },
    {
      name: 'TinyMCEAdapter',
      inputFormat: 'HTML',
      editorElement: '<textarea id="editorId" rows="10" cols="40">initial text</textarea>',
      setEditorContent: (html: string, done: () => void) => {
        tinymce.get("editorId").setContent(html);
        done();
      },
      init: (done) => {
        tinymce.init({
          selector: "#editorId",
          height: 50,
          init_instance_callback: () => {
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
        const adapterConf: AdapterConf = {editorId: 'editorId'};
        var adapterNameSpace = acrolinx.plugins.adapter as any;
        adapter = new adapterNameSpace[adapterName](adapterConf);
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
        const editorContent = (adapter.extractHTMLForCheck() as HtmlResult).html;
        if (adapterSpec.name === 'InputAdapter') {
          assert.equal(editorContent, expectedText);
        }
        else {
          const actualText = $('<div>' + editorContent + '</div>').text().replace('\n', '');
          assert.equal(actualText, expectedText);
        }
      }

      function givenAText(text: string, callback: (text: string) => void) {
        setEditorContent(text, () => {
          adapter.registerCheckCall({checkId: dummyCheckId});
          const htmlResult = adapter.extractHTMLForCheck() as HtmlResult;
          adapter.registerCheckResult({
            checkedPart: {
              checkId: dummyCheckId,
              range: [0, text.length]
            }
          });
          callback(htmlResult.html);
        });
      }

      it('Get initial text from editor element', function () {
        assertEditorText('initial text');
      });

      it('Get current text from editor element', function (done) {
        givenAText('current text', (text) => {
          assertEditorText('current text');
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


      it('Replace discontinues multi range', function (done) {
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

      it('Replace with text looking like entities', function (done) {
        givenAText('wordOne wordTwo wordThree', text => {
          const entities = "&uuml;";
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', entities));
          assertEditorText(`wordOne ${entities} wordThree`);
          done();
        });
      });

      it('Replace with text looking like html tags', function (done) {
        givenAText('wordOne wordTwo wordThree', text => {
          const replacement = "<tagish>";
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', replacement));
          assertEditorText(`wordOne ${replacement} wordThree`);
          done();
        });
      });

      if (adapterSpec.inputFormat === 'TEXT') {
        it('Replace text inside tags', function (done) {
          givenAText('wordOne <part1 part2 part3/> wordThree', text => {
            const replacement = "replacement";
            adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'part3', replacement));
            assertEditorText(`wordOne <part1 part2 ${replacement}/> wordThree`);
            done();
          });
        });
      }


      it('Replace word containing entity', function (done) {
        if (adapterSpec.inputFormat === 'HTML') {
          givenAText('wordOne D&amp;D wordThree', html => {
            const replacement = 'Dungeons and Dragons';
            const matchesWithReplacement = getMatchesWithReplacement(html, 'D&amp;D', replacement);
            matchesWithReplacement[0].content = 'D&D';
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assertEditorText(`wordOne ${replacement} wordThree`);
            done();
          });


        } else {
          givenAText('wordOne D&amp;D wordThree', text => {
            const replacement = 'Dungeons and Dragons';
            const matchesWithReplacement = getMatchesWithReplacement(text, 'D&amp;D', replacement);
            adapter.selectRanges(dummyCheckId, matchesWithReplacement)
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assertEditorText(`wordOne ${replacement} wordThree`);
            done();
          });
        }
      });

      if (adapterSpec.inputFormat === 'HTML') {
        it('Replace word before entity &nbsp;', function (done) {
          givenAText('Southh&nbsp;is warm.', html => {
            const replacement = 'South';
            const matchesWithReplacement = getMatchesWithReplacement(html, 'Southh', replacement);
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assertEditorText(`${replacement}${NON_BREAKING_SPACE}is warm.`);
            done();
          });
        });

        it('Replace words containing entity &nbsp;', function (done) {
          givenAText('South&nbsp;is warm&nbsp;.', html => {
            const replacement = 'South';
            // Some editors wrap the html inside e.g. <p>
            const offset = html.indexOf('South');
            const matchesWithReplacement = [
              {content: 'warm', range: [14 + offset, 18 + offset], replacement: 'warm.'},
              {content: NON_BREAKING_SPACE, range: [18 + offset, 24 + offset], replacement: ''},
              {content: '.', range: [24 + offset, 25 + offset], replacement: ''},
            ] as MatchWithReplacement[];
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assertEditorText(`${replacement}${NON_BREAKING_SPACE}is warm.`);
            done();
          });
        });

      }


      it('Replace same word in correct order', function (done) {
        givenAText('before wordSame wordSame wordSame wordSame wordSame after', text => {
          // The diff approach can not always handle ["a", "b", "c", "d", "e"] correctly.
          const replacements = ["replacement1", "replacement2", "replacement3", "replacement4", "replacement5"];

          function replace(i: number) {
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

      if (adapterSpec.inputFormat === 'HTML') {
        function normalizeResultHtml(html: string) {
          return html.replace(/\n|<span><\/span>/g, '');
        }


        it('Remove complete text content', function (done) {
          givenAText('<p>a</p>', text => {
            const matchesWithReplacement: MatchWithReplacement[] = [
              {"content": "a", "range": [3, 4], "replacement": ""},
            ];
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assert.equal(normalizeResultHtml(adapter.getHTML()),
              adapterSpec.name === 'ContentEditableAdapter' ? '<p></p>' : '');
            done();
          });
        });


        it('Missing space within divs', function (done) {
          givenAText('<div>a b ?</div><div>c</div>', text => {
            const matchesWithReplacement: MatchWithReplacement[] = [
              {"content": "b", "range": [7, 8], "replacement": "b?"},
              {"content": " ", "range": [8, 9], "replacement": ""},
              {"content": "?", "range": [9, 10], "replacement": ""}];
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assert.equal(normalizeResultHtml(adapter.getHTML()), '<div>a b?</div><div>c</div>')
            done();
          });
        });

        it('Replace partially tagged text', function (done) {
          givenAText('<p><strong>a b</strong> .</p>', text => {
            const matchesWithReplacement: MatchWithReplacement[] = [
              {"content": "b", "range": [13, 14], "replacement": "b."},
              {"content": " ", "range": [23, 24], "replacement": ""},
              {"content": ".", "range": [24, 25], "replacement": ""}
            ];
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assert.equal(normalizeResultHtml(adapter.getHTML()), '<p><strong>a b.</strong></p>')
            done();
          });
        });

      }

      it('SelectRanges throws exception if matched document part has changed', function (done) {
        givenAText('wordOne wordTwo wordThree', html => {
          const matchesWithReplacement = getMatchesWithReplacement(html, 'wordTwo');
          setEditorContent('wordOne wordXTwo wordThree', () => {
            assert.throws(() => adapter.selectRanges(dummyCheckId, matchesWithReplacement));
            done();
          });
        });
      });

      it('ReplaceRanges throws exception if matched document part has changed', function (done) {
        givenAText('wordOne wordTwo wordThree', html => {
          const matchesWithReplacement = getMatchesWithReplacement(html, 'wordTwo', 'replacement');
          setEditorContent('wordOne wordXTwo wordThree', () => {
            assert.throws(() => adapter.replaceRanges(dummyCheckId, matchesWithReplacement));
            done();
          });
        });
      });


    });
  });
});
