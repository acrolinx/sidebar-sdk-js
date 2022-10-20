/*
 * Copyright 2022-present Acrolinx GmbH
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

import {AbstractRichtextEditorAdapter} from '../../src';
import {MatchWithReplacement} from '@acrolinx/sidebar-interface';

import * as _ from 'lodash';
import {isChrome} from '../../src/utils/detect-browser';
import {waitMs} from '../utils/test-utils';
import {
  containsEmptyTextNodes,
  getMatchesWithReplacement,
  testIfWindowIsFocused
} from '../utils/test-utils';
import {AdapterInterface, SuccessfulContentExtractionResult} from '../../src/adapters/AdapterInterface';
import {AdapterTestSetup} from './adapter-test-setups/adapter-test-setup';
import {CKEditor5InlineTestSetup} from './adapter-test-setups/ck5-editor-inline';
import {CKEditor5ClassicTestSetup} from './adapter-test-setups/ck5-editor-classic';

const assert = chai.assert;

describe('CKEditor5 adapter test', function () {
  const NON_BREAKING_SPACE = '\u00a0';

  let adapter: AdapterInterface;
  const DELAY_IN_MS = 50;

  const dummyCheckId = 'dummyCheckId';

  const adapters: AdapterTestSetup[] = [
    new CKEditor5InlineTestSetup(),
    new CKEditor5ClassicTestSetup()
  ];

  const testedAdapterNames: string[] = []; // empty = all
  const testedAdapters: AdapterTestSetup[] = adapters.filter(a => _.isEmpty(testedAdapterNames) || _.includes(testedAdapterNames, a.name));

  // eslint-disable-next-line sonarjs/cognitive-complexity
  testedAdapters.forEach(adapterSpec => {
    const adapterName = adapterSpec.name;
    describe('adapter ' + adapterName, function (this: any) {
      this.timeout(10000);

      beforeEach('The before each hook', function (done) {
        $('body').append(adapterSpec.editorElement);
        adapterSpec.init().then((res) => {
          adapter = res;
          done();
        }).catch((res) => {
          assert(false, 'Before each hook failed. ' + res);
          done();
        });
      });

      afterEach(async () => {
        const containsUnwantedEmptyTextNodes = isChrome() && (adapter instanceof AbstractRichtextEditorAdapter) &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          containsEmptyTextNodes((adapter as any).getEditorElement());

        await adapterSpec.remove();

        assert.isFalse(containsUnwantedEmptyTextNodes, 'The editorElement should not contain empty text nodes');
      });

      const setEditorContent = adapterSpec.setEditorContent.bind(adapterSpec);

      function assertEditorText(expectedText: string) {
        const editorContent = (adapter.extractContentForCheck({}) as SuccessfulContentExtractionResult).content;
        if (adapterSpec.inputFormat === 'TEXT') {
          assert.equal(editorContent, expectedText);
        } else {
          const actualText = $('<div>' + editorContent + '</div>').text().replace('\n', '');
          assert.equal(actualText, expectedText);
        }
      }

      function registerCheckResult(text: string) {
        adapter.registerCheckResult({
          checkedPart: {
            checkId: dummyCheckId,
            range: [0, text.length]
          }
        });
      }

      function givenAText(text: string, callback: (initialExtractedContent: string) => void) {
        setEditorContent(text, async () => {
          adapter.registerCheckCall({checkId: dummyCheckId});
          const contentExtractionResult = adapter.extractContentForCheck({}) as SuccessfulContentExtractionResult;
          registerCheckResult(text);
          await callback(contentExtractionResult.content);
        });
      }

      function givenATextWithoutCheckResult(text: string, callback: (initialExtractedContent: string) => void) {
        setEditorContent(text, () => {
          adapter.registerCheckCall({checkId: dummyCheckId});
          const contentExtractionResult = adapter.extractContentForCheck({}) as SuccessfulContentExtractionResult;
          callback(contentExtractionResult.content);
        });
      }

      function normalizeResultHtml(html: string) {
        return html.replace(/\n|<span><\/span>/g, '');
      }

      it('Get initial text from editor element', function () {
        assertEditorText('initial text');
      });

      it('Get current text from editor element', function (done) {
        givenAText('current text', () => {
          assertEditorText('current text');
          done();
        });
      });

      it('Extract initial HTML from editor element', function () {
        assertEditorText('initial text');
      });

      it('Extract current HTML from editor element', function (done) {
        givenAText('current text', () => {
          assertEditorText('current text');
          done();
        });
      });

      it('Don\'t change surrounding words when replacing', function (done) {
        givenAText('wordOne wordTwo wordThree', async (text) => {
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne wordTwoReplacement wordThree');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace words in reverse order', function (done) {
        givenAText('wordOne wordTwo wordThree', async (text) => {
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'wordThreeReplacement'));
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne wordTwoReplacement wordThreeReplacement');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace words in order', function (done) {
        givenAText('wordOne wordTwo wordThree', async (text) => {
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'wordThreeReplacement'));
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne wordTwoReplacement wordThreeReplacement');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
          
        });
      });

      it('Replace second of the same word', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', async (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement');
          await adapter.replaceRanges(dummyCheckId, [matchWithReplacement[1]]);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne wordSame wordSameReplacement wordThree');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace first of the same word', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', async (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement');
          await adapter.replaceRanges(dummyCheckId, [matchWithReplacement[0]]);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne wordSameReplacement wordSame wordThree');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace the same word with word in between two times with different replacements', function (done) {
        givenAText('wordOne wordSame blubb wordSame wordThree', async (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement2');
          await adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          await adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne wordSameReplacement1 blubb wordSameReplacement2 wordThree');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace the same word two times with different replacements', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', async (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
          await adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          await adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne wordSame1 wordSame2 wordThree');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });


      it('Replace the same word two times with different replacements, where the first replacement is kinda long', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', async (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSamelonglonglonglong1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
          await adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          await adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne wordSamelonglonglonglong1 wordSame2 wordThree');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace the same word two times with different replacements in reverse oder', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', async (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
          await adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          await adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne wordSame1 wordSame2 wordThree');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace single character ","', function (done) {
        givenAText('wordOne, wordTwo', async (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, ',', '');
          await adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne wordTwo');
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
          done();
        });
      });

      it('Replace single character space', function (done) {
        givenAText('wordOne wordTwo', async (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, ' ', '');
          await adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOnewordTwo');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });


      it('Replace continues multi range for an apple', function (done) {
        givenAText('a apple', async (text) => {
          const word1 = getMatchesWithReplacement(text, 'a', 'an apple')[0];
          const word2 = getMatchesWithReplacement(text, 'apple', '')[0];
          const space = {
            content: ' ',
            replacement: '',
            range: [word1.range[1], word2.range[0]] as [number, number]
          };

          await adapter.replaceRanges(dummyCheckId, [word1, space, word2]);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('an apple');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace continues multi range', function (done) {
        givenAText('word0 blub mist word3', async (text) => {
          const word1 = getMatchesWithReplacement(text, 'blub', 'a')[0];
          const word2 = getMatchesWithReplacement(text, 'mist', 'b')[0];
          const space = {
            content: ' ',
            replacement: '',
            range: [word1.range[1], word2.range[0]] as [number, number]
          };

          await adapter.replaceRanges(dummyCheckId, [word1, space, word2]);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('word0 ab word3');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace continues multi range with number in words', function (done) {
        givenAText('word0 blub1 mist2 word3', async (text) => {

          const word1 = getMatchesWithReplacement(text, 'blub1', 'a')[0];
          const word2 = getMatchesWithReplacement(text, 'mist2', 'b')[0];
          const space = {
            content: ' ',
            replacement: '',
            range: [word1.range[1], word2.range[0]] as [number, number]
          };

          await adapter.replaceRanges(dummyCheckId, [word1, space, word2]);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('word0 ab word3');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace first and only char', function (done) {
        givenAText('x', text => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('aa');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace first and only word', function (done) {
        givenAText('xyz', async (text) => {
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'xyz', 'aa'));
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('aa');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace first char', function (done) {
        givenAText('x after', async (text) => {
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('aa after');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace first word', function (done) {
        givenAText('xyz after', async (text) => {
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'xyz', 'aa'));
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('aa after');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace single chars', function (done) {
        givenAText('y x f z u', async (text) => {

          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'f', 'bb'));
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'z', 'cc'));
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'u', 'dd'));

          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('y aa bb cc dd');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace inside a word', function (done) {
        givenAText('InsideAllWord', async (text) => {

          const matchWithReplacement = getMatchesWithReplacement(text, 'All', '12345');
          await adapter.replaceRanges(dummyCheckId, matchWithReplacement);

          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('Inside12345Word');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace last word', function (done) {
        givenAText('wordOne wordTwo', async (text) => {

          const matchesWithReplacement = getMatchesWithReplacement(text, 'wordTwo', 'wordTw');
          await adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne wordTw');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace last word with short word', function (done) {
        givenAText('wordOne wordTwo', async (text) => {

          const matchesWithReplacement = getMatchesWithReplacement(text, 'wordTwo', 'beer');
          await adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('wordOne beer');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });


      it('Replace discontinues multi range', function (done) {
        givenAText('wordOne wordTwo wordThree wordFour', async (text) => {
          const matchesWithReplacement = [
            getMatchesWithReplacement(text, 'wordOne', 'a')[0],
            getMatchesWithReplacement(text, 'wordThree', 'c')[0]
          ];
          await adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText('a wordTwo c wordFour');
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace with and after strange chars', function (done) {
        givenAText('wordOne wordTwo wordThree wordFour', async (text) => {
          const strangeChars = '[]()/&%$§"!\'*+~öäü:,;-<>|^°´`òê€@ß?={}µコンピュータ';
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', strangeChars));
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'c'));
          // TODO: Depending on the document type, we should test for correct escaping.

          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText(`wordOne ${ strangeChars } c wordFour`);
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace with text looking like entities', function (done) {
        givenAText('wordOne wordTwo wordThree', async (text) => {
          const entities = '&uuml;';
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', entities));

          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText(`wordOne ${ entities } wordThree`);
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace with text looking like html tags', function (done) {
        givenAText('wordOne wordTwo wordThree', async (text) => {
          const replacement = '<tagish>';
          await adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', replacement));

          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText(`wordOne ${ replacement } wordThree`);
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('Replace word containing entity', function (done) {
        givenAText('wordOne D&amp;D wordThree', async (html) => {
          const replacement = 'Dungeons and Dragons';
          const matchesWithReplacement = getMatchesWithReplacement(html, 'D&amp;D', replacement);
          matchesWithReplacement[0].content = 'D&D';
          await adapter.selectRanges(dummyCheckId, matchesWithReplacement);
          await adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText(`wordOne ${ replacement } wordThree`);
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
        
      });

      if (adapterSpec.inputFormat === 'HTML') {
        it('Replace word before entity &nbsp;', function (done) {
          givenAText('Southh&nbsp;is warm.', async (html) => {
            const replacement = 'South';
            const matchesWithReplacement = getMatchesWithReplacement(html, 'Southh', replacement);
            await adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            await adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            waitMs(DELAY_IN_MS).then(() => {
              assertEditorText(`${ replacement }${ NON_BREAKING_SPACE }is warm.`);
              done();
            }).catch(() => {
              assert(false, 'Unable to synchronize with replacement event');
              done();
            });
          });
        });

        it('Replace words containing entity &nbsp;', function (done) {
          givenAText('South&nbsp;is warm&nbsp;.', async (html) => {
            const replacement = 'South';
            // Some editors wrap the html inside e.g. <p>
            const offset = html.indexOf('South');
            const matchesWithReplacement = [
              {content: 'warm', range: [14 + offset, 18 + offset], replacement: 'warm.'},
              {content: NON_BREAKING_SPACE, range: [18 + offset, 24 + offset], replacement: ''},
              {content: '.', range: [24 + offset, 25 + offset], replacement: ''},
            ] as MatchWithReplacement[];
            await adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            await adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            waitMs(DELAY_IN_MS).then(() => {
              assertEditorText(`${ replacement }${ NON_BREAKING_SPACE }is warm.`);
              done();
            }).catch(() => {
              assert(false, 'Unable to synchronize with replacement event');
              done();
            });
          });
        });
      }

      it('Replace same word in correct order', function (done) {
        givenAText('before wordSame wordSame wordSame wordSame wordSame after', async (text) => {
          // The diff approach can not always handle ["a", "b", "c", "d", "e"] correctly.
          const replacements = ['replacement1', 'replacement2', 'replacement3', 'replacement4', 'replacement5'];

          async function replace(i: number) {
            await adapter.replaceRanges(dummyCheckId, [getMatchesWithReplacement(text, 'wordSame', replacements[i])[i]]);
          }

          await replace(0);
          await replace(4);
          await replace(2);
          await replace(3);
          await replace(1);

          waitMs(DELAY_IN_MS).then(() => {
            assertEditorText(`before ${ replacements.join(' ') } after`);
            done();
          }).catch(() => {
            assert(false, 'Unable to synchronize with replacement event');
            done();
          });
        });
      });

      it('selectRanges does not change text', function (done) {
        const words = ['wordOne', 'wordTwo', 'wordThree', 'wordFour'];
        const editorText = words.join(' ');
        givenAText(editorText, async (text) => {
          words.forEach(async (word) => {
            await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(text, word, ''));
          });

          await adapter.selectRanges(dummyCheckId, [
            getMatchesWithReplacement(text, words[0], '')[0],
            getMatchesWithReplacement(text, words[words.length - 1], '')[0]
          ]);

          await adapter.selectRanges(dummyCheckId, [
            getMatchesWithReplacement(text, words[1], '')[0],
            getMatchesWithReplacement(text, words[2], '')[0]
          ]);

          assertEditorText(editorText);
          done();
        });
      });

      if (adapterSpec.inputFormat === 'HTML') {
        it('Remove complete text content', function (done) {
          givenAText('<p>a</p>', async () => {
            const matchesWithReplacement: MatchWithReplacement[] = [
              {'content': 'a', 'range': [3, 4], 'replacement': ''},
            ];
            await adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

            waitMs(DELAY_IN_MS).then(() => {
              done();
            }).catch(() => {
              assert(false, 'Unable to synchronize with replacement event');
              done();
            });
          });
        });


        it.skip('Missing space within divs', function (done) {
          givenAText('<div>a b ?</div><div>c</div>', async () => {
            const matchesWithReplacement: MatchWithReplacement[] = [
              {'content': 'b', 'range': [7, 8], 'replacement': 'b?'},
              {'content': ' ', 'range': [8, 9], 'replacement': ''},
              {'content': '?', 'range': [9, 10], 'replacement': ''}];
              await adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

            waitMs(DELAY_IN_MS).then(() => {
              assert.equal(normalizeResultHtml(adapter.getContent!({})), '<div>a b?</div><div>c</div>');
              done();
            }).catch(() => {
              assert(false, 'Unable to synchronize with replacement event');
              done();
            });
          });
        });

      }

      it('SelectRanges throws exception if matched document part has changed', function (done) {
        givenAText('wordOne wordTwo wordThree', (html) => {
          const matchesWithReplacement = getMatchesWithReplacement(html, 'wordTwo');
          setEditorContent('wordOne wordXTwo wordThree', async () => {
            try{
              await adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            } catch (e){
              done();
            }
          });
        });
      });

      it('ReplaceRanges throws exception if matched document part has changed', function (done) {
        givenAText('wordOne wordTwo wordThree', async (html) => {
          const matchesWithReplacement = getMatchesWithReplacement(html, 'wordTwo', 'replacement');
          setEditorContent('wordOne wordXTwo wordThree', async () => {
            try {
              await adapter.replaceRanges(dummyCheckId, matchesWithReplacement); 
            } catch (e) {
              assert.isDefined(e);
            }

            waitMs(DELAY_IN_MS).then(() => {
              done();
            }).catch(() => {
              assert(false, 'Unable to synchronize with replacement event');
              done();
            });
          });
        });
      });

      describe('selectRanges', () => {
        testIfWindowIsFocused('should select the correct text', (done) => {
          const completeContent = '<p>begin selection end</p>';
          givenAText(completeContent, async (initialExtractedContent) => {
            const matchesWithReplacement = getMatchesWithReplacement(initialExtractedContent, 'selection');
            await adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            assert.equal(adapterSpec.getSelectedText(), 'selection');
            done();
          });
        });
      });

      describe('previous successful check, but current check has not finished', () => {
        let matchesWithReplacementOfFirstCheck: MatchWithReplacement[];
        beforeEach((done) => {
          const completeContent = 'begin selection end';
          givenAText(completeContent, initialExtractedContent => {
            matchesWithReplacementOfFirstCheck = getMatchesWithReplacement(initialExtractedContent, 'selection', 'replacement');
            done();
          });
        });

        it('replaces ranges of previous check', (done) => {
          const completeNewContent = 'change begin selection end';
          givenATextWithoutCheckResult(completeNewContent, async (_initialExtractedContent) => {
            await adapter.replaceRanges(dummyCheckId, matchesWithReplacementOfFirstCheck);

            waitMs(DELAY_IN_MS).then(() => {
              assertEditorText('change begin replacement end');
              done();
            }).catch(() => {
              assert(false, 'Unable to synchronize with replacement event');
              done();
            });
          });
        });
      });

    });
  });
});
