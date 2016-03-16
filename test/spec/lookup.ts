import AdapterInterface = acrolinx.plugins.adapter.AdapterInterface;
import Match = acrolinx.sidebar.Match;
import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
var assert = chai.assert;
var expect = chai.expect;

describe('adapter test', function () {

  let adapter:AdapterInterface;

  const dummyCheckId = 'dummyCheckId';

  interface AdapterSpec {
    name: string;
    editorElement: string;
    setHtml: Function;
    init?: Function;
  }

  const adapters:AdapterSpec[] = [
    {
      name: 'ContentEditableAdapter',
      editorElement: '<div id="editorId" contenteditable="true">initial text</div>',
      setHtml: (html:string) => {
        $('#editorId').html(html);
      }
    },
    {
      name: 'InputAdapter',
      editorElement: '<textarea id="editorId">initial text</textarea>',
      setHtml: (html:string) => {
        $('#editorId').val(html);
      }
    }
    /*{
      name: 'CKEditorAdapter',
      editorElement: '<textarea name="editorId" id="editorId" rows="10" cols="40">initial text</textarea>',
      setHtml: (html:string) => {
        CKEDITOR.instances['editorId'].setData(html);
      },
      init: (done) => {
        CKEDITOR.replace('editorId');
        CKEDITOR.instances['editorId'].on("instanceReady", () => {
          done();
        });
      }
    }*/
  ];


  adapters.forEach(adapterSpec => {

    const adapterName = adapterSpec.name;
    describe('adapter ' + adapterName, function () {

      beforeEach( (done) => {
        $('body').append(adapterSpec.editorElement);
        adapter = new acrolinx.plugins.adapter[adapterName]({editorId: 'editorId'});
        if (adapterSpec.init) {
          adapterSpec.init(done);
        } else {
          done();
        }
      });

      afterEach(() => {
        if (adapterSpec.name === 'CKEditorAdapter') {
          CKEDITOR.instances['editorId'].destroy();
        }
        $('#editorId').remove();
      });

      const setHtml = adapterSpec.setHtml;

      it('Get initial text from editor element', function () {
        assert.equal(adapter.getCurrentText(), 'initial text');
      });

      it('Get current text from editor element', function () {
        setHtml('current text');
        assert.equal(adapter.getCurrentText(), 'current text');
      });

      it('Extract initial HTML from editor element', function () {
        assert.equal(adapter.extractHTMLForCheck().html, 'initial text');
      });

      describe('lookup', () => {
        function getMatchWithReplacement(completeString:string, partialString:string, replacement:string):MatchWithReplacement[] {
          const matches:MatchWithReplacement[] = [];
          let offsetStart:number;
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

        function givenAText(completeString:string) {
          setHtml(completeString);
          adapter.extractHTMLForCheck();
          return completeString;
        }

        it('Don\'t change surrounding words when replacing', function () {
          const completeString = givenAText('wordOne wordTwo wordThree');
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(completeString, 'wordTwo', 'wordTwoReplacement'));
          assert.equal(adapter.getCurrentText(), 'wordOne wordTwoReplacement wordThree');
        });

        it('Replace words in reverse order', function () {
          const completeString = givenAText('wordOne wordTwo wordThree');
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(completeString, 'wordThree', 'wordThreeReplacement'));
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(completeString, 'wordTwo', 'wordTwoReplacement'));
          assert.equal(adapter.getCurrentText(), 'wordOne wordTwoReplacement wordThreeReplacement');
        });

        it('Replace words in order', function () {
          const completeString = givenAText('wordOne wordTwo wordThree');
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(completeString, 'wordTwo', 'wordTwoReplacement'));
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(completeString, 'wordThree', 'wordThreeReplacement'));
          assert.equal(adapter.getCurrentText(), 'wordOne wordTwoReplacement wordThreeReplacement');
        });

        it('Replace second of the same word', function () {
          const completeString = givenAText('wordOne wordSame wordSame wordThree');
          const matchWithReplacement = getMatchWithReplacement(completeString, 'wordSame', 'wordSameReplacement');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement[1]]);
          assert.equal(adapter.getCurrentText(), 'wordOne wordSame wordSameReplacement wordThree');
        });

        it('Replace first of the same word', function () {
          const completeString = givenAText('wordOne wordSame wordSame wordThree');
          const matchWithReplacement = getMatchWithReplacement(completeString, 'wordSame', 'wordSameReplacement');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement[0]]);
          assert.equal(adapter.getCurrentText(), 'wordOne wordSameReplacement wordSame wordThree');
        });

        it('Replace the same word with word in between two times with different replacements', function () {
          const completeString = givenAText('wordOne wordSame blubb wordSame wordThree');
          const matchWithReplacement1 = getMatchWithReplacement(completeString, 'wordSame', 'wordSameReplacement1');
          const matchWithReplacement2 = getMatchWithReplacement(completeString, 'wordSame', 'wordSameReplacement2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assert.equal(adapter.getCurrentText(), 'wordOne wordSameReplacement1 blubb wordSameReplacement2 wordThree');
        });

        it('Replace the same word two times with different replacements', function () {
          const completeString = givenAText('wordOne wordSame wordSame wordThree');
          const matchWithReplacement1 = getMatchWithReplacement(completeString, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchWithReplacement(completeString, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assert.equal(adapter.getCurrentText(), 'wordOne wordSame1 wordSame2 wordThree');
        })

        it.skip('Replace the same word two times with different replacements, where the first replacement is kinda long', function () {
          const completeString = givenAText('wordOne wordSame wordSame wordThree');
          const matchWithReplacement1 = getMatchWithReplacement(completeString, 'wordSame', 'wordSamelonglonglonglong1');
          const matchWithReplacement2 = getMatchWithReplacement(completeString, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assert.equal(adapter.getCurrentText(), 'wordOne wordSamelonglonglonglong1 wordSame2 wordThree');
        });

        it('Replace the same word two times with different replacements in reverse oder', function () {
          const completeString = givenAText('wordOne wordSame wordSame wordThree');
          const matchWithReplacement1 = getMatchWithReplacement(completeString, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchWithReplacement(completeString, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          assert.equal(adapter.getCurrentText(), 'wordOne wordSame1 wordSame2 wordThree');
        });

        it('Replace single character ","', function () {
          const completeString = givenAText('wordOne, wordTwo');
          const matchWithReplacement = getMatchWithReplacement(completeString, ',', '');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          assert.equal(adapter.getCurrentText(), 'wordOne wordTwo');
        });

        it('Replace single character space', function () {
          const completeString = givenAText('wordOne wordTwo');
          const matchWithReplacement = getMatchWithReplacement(completeString, ' ', '');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          assert.equal(adapter.getCurrentText(), 'wordOnewordTwo');
        });

        it('Replace continues multi range', function () {
          const completeString = givenAText('word0 blub mist word3');

          const word1 = getMatchWithReplacement(completeString, 'blub', "a")[0];
          const word2 = getMatchWithReplacement(completeString, 'mist', "b")[0];
          const space = {
            content: " ",
            replacement: "",
            range: [word1.range[1], word2.range[0]] as [number, number]
          };

          adapter.replaceRanges(dummyCheckId, [word1, space, word2]);
          assert.equal(adapter.getCurrentText(), 'word0 ab word3');
        });

        it.skip('Replace continues multi range with number in words', function () {
          const completeString = givenAText('word0 blub1 mist2 word3');

          const word1 = getMatchWithReplacement(completeString, 'blub1', "a")[0];
          const word2 = getMatchWithReplacement(completeString, 'mist2', "b")[0];
          const space = {
            content: " ",
            replacement: "",
            range: [word1.range[1], word2.range[0]] as [number, number]
          };

          adapter.replaceRanges(dummyCheckId, [word1, space, word2]);
          assert.equal(adapter.getCurrentText(), 'word0 ab word3');
        });

        it('Replace single chars', function () {
          const completeString = givenAText('x f z u');

          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(completeString, 'x', 'aa'));
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(completeString, 'f', 'bb'));
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(completeString, 'z', 'cc'));
          adapter.replaceRanges(dummyCheckId, getMatchWithReplacement(completeString, 'u', 'dd'));

          assert.equal(adapter.getCurrentText(), 'aa bb cc dd');
        });

        it.skip('Replace inside a word', function () {
          const completeString = givenAText('InsideAllWord');

          var matchWithReplacement = getMatchWithReplacement(completeString, 'All', '12345');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);

          assert.equal(adapter.getCurrentText(), 'Inside12345Word');
        });


      })

    })
  })

});
