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

import { AbstractRichtextEditorAdapter } from '../../src';
import { MatchWithReplacement } from '@acrolinx/sidebar-interface';

import * as _ from 'lodash';
import { isChrome } from '../../src/utils/detect-browser';
import { containsEmptyTextNodes, getMatchesWithReplacement, testIfWindowIsFocused, waitMs } from '../utils/test-utils';
import { AdapterInterface, SuccessfulContentExtractionResult } from '../../src/adapters/AdapterInterface';
import { AdapterTestSetup } from './adapter-test-setups/adapter-test-setup';
import { CKEditor5InlineTestSetup } from './adapter-test-setups/ck5-editor-inline';

const assert = chai.assert;

describe('CKEditor5 adapter test', function () {
  const NON_BREAKING_SPACE = '\u00a0';

  let adapter: AdapterInterface;

  const dummyCheckId = 'dummyCheckId';

  const adapters: AdapterTestSetup[] = [new CKEditor5InlineTestSetup()];

  const testedAdapterNames: string[] = []; // empty = all
  const testedAdapters: AdapterTestSetup[] = adapters.filter(
    (a) => _.isEmpty(testedAdapterNames) || _.includes(testedAdapterNames, a.name),
  );

  testedAdapters.forEach((adapterSpec) => {
    const adapterName = adapterSpec.name;
    describe('adapter ' + adapterName, function (this: any) {
      this.timeout(10000);

      beforeEach('The before each hook', function (done) {
        $('body').append(adapterSpec.editorElement);
        adapterSpec
          .init()
          .then((res) => {
            adapter = res;
            done();
          })
          .catch((res) => {
            assert.fail('Before each hook failed. ' + res);
            done();
          });
      });

      afterEach(async () => {
        const containsUnwantedEmptyTextNodes =
          isChrome() &&
          adapter instanceof AbstractRichtextEditorAdapter &&
          containsEmptyTextNodes((adapter as any).getEditorElement());

        await adapterSpec.remove();

        chai.assert.isFalse(containsUnwantedEmptyTextNodes, 'The editorElement should not contain empty text nodes');
      });

      const setEditorContent = adapterSpec.setEditorContent.bind(adapterSpec);

      function assertEditorText(expectedText: string) {
        const editorContent = (adapter.extractContentForCheck({}) as SuccessfulContentExtractionResult).content;
        if (adapterSpec.inputFormat === 'TEXT') {
          assert.equal(editorContent, expectedText);
        } else {
          const actualText = $('<div>' + editorContent + '</div>')
            .text()
            .replace('\n', '');
          assert.equal(actualText, expectedText);
        }
      }

      function registerCheckResult(text: string) {
        adapter.registerCheckResult({
          checkedPart: {
            checkId: dummyCheckId,
            range: [0, text.length],
          },
        });
      }

      function givenAText(text: string, callback: (initialExtractedContent: string) => void) {
        setEditorContent(text, () => {
          adapter.registerCheckCall({ checkId: dummyCheckId });
          const contentExtractionResult = adapter.extractContentForCheck({}) as SuccessfulContentExtractionResult;
          registerCheckResult(text);
          callback(contentExtractionResult.content);
        });
      }

      function givenATextWithoutCheckResult(text: string, callback: (initialExtractedContent: string) => void) {
        setEditorContent(text, () => {
          adapter.registerCheckCall({ checkId: dummyCheckId });
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

      it("Don't change surrounding words when replacing", function (done) {
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
        givenAText('wordOne wordTwo wordThree', async (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          assertEditorText('wordOne wordTwoReplacement wordThree');
          await waitMs(10);
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'wordThreeReplacement'));
          assertEditorText('wordOne wordTwoReplacement wordThreeReplacement');
          done();
        });
      });

      it('Replace second of the same word', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement[1]]);
          assertEditorText('wordOne wordSame wordSameReplacement wordThree');
          done();
        });
      });

      it('Replace first of the same word', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement[0]]);
          assertEditorText('wordOne wordSameReplacement wordSame wordThree');
          done();
        });
      });

      it('Replace the same word with word in between two times with different replacements', function (done) {
        givenAText('wordOne wordSame blubb wordSame wordThree', async (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          await waitMs(10);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText('wordOne wordSameReplacement1 blubb wordSameReplacement2 wordThree');
          done();
        });
      });

      it('Replace the same word two times with different replacements', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', async (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');

          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          await waitMs(10);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText('wordOne wordSame1 wordSame2 wordThree');
          done();
        });
      });

      it('Replace the same word two times with different replacements, where the first replacement is kinda long', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', async (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSamelonglonglonglong1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');

          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          await waitMs(10);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText('wordOne wordSamelonglonglonglong1 wordSame2 wordThree');
          done();
        });
      });

      it('Replace the same word two times with different replacements in reverse oder', function (done) {
        givenAText('wordOne wordSame wordSame wordThree', async (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          await waitMs(10);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          assertEditorText('wordOne wordSame1 wordSame2 wordThree');
          done();
        });
      });

      it('Replace single character ","', function (done) {
        givenAText('wordOne, wordTwo', (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, ',', '');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          assertEditorText('wordOne wordTwo');
          done();
        });
      });

      it('Replace single character space', function (done) {
        givenAText('wordOne wordTwo', (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, ' ', '');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          assertEditorText('wordOnewordTwo');
          done();
        });
      });

      it('Replace continues multi range', function (done) {
        givenAText('word0 blub mist word3', (text) => {
          const word1 = getMatchesWithReplacement(text, 'blub', 'a')[0];
          const word2 = getMatchesWithReplacement(text, 'mist', 'b')[0];
          const space = {
            content: ' ',
            replacement: '',
            range: [word1.range[1], word2.range[0]] as [number, number],
          };

          adapter.replaceRanges(dummyCheckId, [word1, space, word2]);
          assertEditorText('word0 ab word3');
          done();
        });
      });

      it('Replace continues multi range with number in words', function (done) {
        givenAText('word0 blub1 mist2 word3', (text) => {
          const word1 = getMatchesWithReplacement(text, 'blub1', 'a')[0];
          const word2 = getMatchesWithReplacement(text, 'mist2', 'b')[0];
          const space = {
            content: ' ',
            replacement: '',
            range: [word1.range[1], word2.range[0]] as [number, number],
          };

          adapter.replaceRanges(dummyCheckId, [word1, space, word2]);
          assertEditorText('word0 ab word3');
          done();
        });
      });

      it('Replace first and only char', function (done) {
        givenAText('x', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          assertEditorText('aa');
          done();
        });
      });

      it('Replace first and only word', function (done) {
        givenAText('xyz', async (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'xyz', 'aa'));
          assertEditorText('aa');
          done();
        });
      });

      it('Replace first char', function (done) {
        givenAText('x after', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          assertEditorText('aa after');
          done();
        });
      });

      it('Replace first word', function (done) {
        givenAText('xyz after', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'xyz', 'aa'));
          assertEditorText('aa after');
          done();
        });
      });

      it('Replace single chars', function (done) {
        givenAText('y x f z u', async (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          await waitMs(10);
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'f', 'bb'));
          await waitMs(10);
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'z', 'cc'));
          await waitMs(10);
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'u', 'dd'));
          assertEditorText('y aa bb cc dd');
          done();
        });
      });

      it('Replace inside a word', function (done) {
        givenAText('InsideAllWord', (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, 'All', '12345');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          assertEditorText('Inside12345Word');
          done();
        });
      });

      it('Replace last word', function (done) {
        givenAText('wordOne wordTwo', (text) => {
          const matchesWithReplacement = getMatchesWithReplacement(text, 'wordTwo', 'wordTw');
          adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
          assertEditorText('wordOne wordTw');
          done();
        });
      });

      it('Replace last word with short word', function (done) {
        givenAText('wordOne wordTwo', (text) => {
          const matchesWithReplacement = getMatchesWithReplacement(text, 'wordTwo', 'beer');
          adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
          assertEditorText('wordOne beer');
          done();
        });
      });

      it('Replace discontinues multi range', function (done) {
        givenAText('wordOne wordTwo wordThree wordFour', (text) => {
          const matchesWithReplacement = [
            getMatchesWithReplacement(text, 'wordOne', 'a')[0],
            getMatchesWithReplacement(text, 'wordThree', 'c')[0],
          ];
          adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
          assertEditorText('a wordTwo c wordFour');
          done();
        });
      });

      it('Replace with and after strange chars', function (done) {
        givenAText('wordOne wordTwo wordThree wordFour', async (text) => {
          const strangeChars = '[]()/&%$§"!\'*+~öäü:,;-<>|^°´`òê€@ß?={}µコンピュータ';

          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', strangeChars));
          await waitMs(10);
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'c'));
          // TODO: Depending on the document type, we should test for correct escaping.
          assertEditorText(`wordOne ${strangeChars} c wordFour`);
          done();
        });
      });

      it('Replace with text looking like entities', function (done) {
        givenAText('wordOne wordTwo wordThree', (text) => {
          const entities = '&uuml;';
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', entities));
          assertEditorText(`wordOne ${entities} wordThree`);
          done();
        });
      });

      it('Replace with text looking like html tags', function (done) {
        givenAText('wordOne wordTwo wordThree', (text) => {
          const replacement = '<tagish>';
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', replacement));
          assertEditorText(`wordOne ${replacement} wordThree`);
          done();
        });
      });

      it('Replace word containing entity', function (done) {
        givenAText('wordOne D&amp;D wordThree', (html) => {
          const replacement = 'Dungeons and Dragons';
          const matchesWithReplacement = getMatchesWithReplacement(html, 'D&amp;D', replacement);
          matchesWithReplacement[0].content = 'D&D';
          adapter.selectRanges(dummyCheckId, matchesWithReplacement);
          adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
          assertEditorText(`wordOne ${replacement} wordThree`);
          done();
        });
      });

      if (adapterSpec.inputFormat === 'HTML') {
        it('Replace word before entity &nbsp;', function (done) {
          givenAText('Southh&nbsp;is warm.', (html) => {
            const replacement = 'South';
            const matchesWithReplacement = getMatchesWithReplacement(html, 'Southh', replacement);
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assertEditorText(`${replacement}${NON_BREAKING_SPACE}is warm.`);
            done();
          });
        });

        it('Replace words containing entity &nbsp;', function (done) {
          givenAText('South&nbsp;is warm&nbsp;.', (html) => {
            const replacement = 'South';
            // Some editors wrap the html inside e.g. <p>
            const offset = html.indexOf('South');
            const matchesWithReplacement = [
              { content: 'warm', range: [14 + offset, 18 + offset], replacement: 'warm.' },
              { content: NON_BREAKING_SPACE, range: [18 + offset, 24 + offset], replacement: '' },
              { content: '.', range: [24 + offset, 25 + offset], replacement: '' },
            ] as MatchWithReplacement[];
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assertEditorText(`${replacement}${NON_BREAKING_SPACE}is warm.`);
            done();
          });
        });
      }

      it('Replace same word in correct order', function (done) {
        givenAText('before wordSame wordSame wordSame wordSame wordSame after', async (text) => {
          // The diff approach can not always handle ["a", "b", "c", "d", "e"] correctly.
          const replacements = ['replacement1', 'replacement2', 'replacement3', 'replacement4', 'replacement5'];

          function replace(i: number) {
            adapter.replaceRanges(dummyCheckId, [getMatchesWithReplacement(text, 'wordSame', replacements[i])[i]]);
          }

          replace(0);
          await waitMs(10);
          replace(4);
          await waitMs(10);
          replace(2);
          await waitMs(10);
          replace(3);
          await waitMs(10);
          replace(1);

          assertEditorText(`before ${replacements.join(' ')} after`);
          done();
        });
      });

      it('selectRanges does not change text', function (done) {
        const words = ['wordOne', 'wordTwo', 'wordThree', 'wordFour'];
        const editorText = words.join(' ');
        givenAText(editorText, (text) => {
          words.forEach((word) => {
            adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(text, word, ''));
          });

          adapter.selectRanges(dummyCheckId, [
            getMatchesWithReplacement(text, words[0], '')[0],
            getMatchesWithReplacement(text, words[words.length - 1], '')[0],
          ]);

          adapter.selectRanges(dummyCheckId, [
            getMatchesWithReplacement(text, words[1], '')[0],
            getMatchesWithReplacement(text, words[2], '')[0],
          ]);

          assertEditorText(editorText);
          done();
        });
      });

      if (adapterSpec.inputFormat === 'HTML') {
        it.skip('Remove complete text content', function (done) {
          givenAText('<p>a</p>', async () => {
            const matchesWithReplacement: MatchWithReplacement[] = [{ content: 'a', range: [3, 4], replacement: '' }];
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            waitMs(10);
            done();
          });
        });

        it.skip('Missing space within divs', function (done) {
          givenAText('<div>a b ?</div><div>c</div>', () => {
            const matchesWithReplacement: MatchWithReplacement[] = [
              { content: 'b', range: [7, 8], replacement: 'b?' },
              { content: ' ', range: [8, 9], replacement: '' },
              { content: '?', range: [9, 10], replacement: '' },
            ];
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assert.equal(normalizeResultHtml(adapter.getContent!({})), '<div>a b?</div><div>c</div>');
            done();
          });
        });
      }

      it('SelectRanges throws exception if matched document part has changed', function (done) {
        givenAText('wordOne wordTwo wordThree', (html) => {
          const matchesWithReplacement = getMatchesWithReplacement(html, 'wordTwo');
          setEditorContent('wordOne wordXTwo wordThree', () => {
            assert.throws(() => adapter.selectRanges(dummyCheckId, matchesWithReplacement));
            done();
          });
        });
      });

      it('ReplaceRanges throws exception if matched document part has changed', function (done) {
        givenAText('wordOne wordTwo wordThree', (html) => {
          const matchesWithReplacement = getMatchesWithReplacement(html, 'wordTwo', 'replacement');
          setEditorContent('wordOne wordXTwo wordThree', () => {
            assert.throws(() => adapter.replaceRanges(dummyCheckId, matchesWithReplacement));
            done();
          });
        });
      });

      describe('selectRanges', () => {
        testIfWindowIsFocused('should select the correct text', (done) => {
          const completeContent = '<p>begin selection end</p>';
          givenAText(completeContent, (initialExtractedContent) => {
            const matchesWithReplacement = getMatchesWithReplacement(initialExtractedContent, 'selection');
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            assert.equal(adapterSpec.getSelectedText(), 'selection');
            done();
          });
        });
      });

      describe('previous successful check, but current check has not finished', () => {
        let matchesWithReplacementOfFirstCheck: MatchWithReplacement[];
        beforeEach((done) => {
          const completeContent = 'begin selection end';
          givenAText(completeContent, (initialExtractedContent) => {
            matchesWithReplacementOfFirstCheck = getMatchesWithReplacement(
              initialExtractedContent,
              'selection',
              'replacement',
            );
            done();
          });
        });

        it('replaces ranges of previous check', (done) => {
          const completeNewContent = 'change begin selection end';
          givenATextWithoutCheckResult(completeNewContent, (_initialExtractedContent) => {
            adapter.replaceRanges(dummyCheckId, matchesWithReplacementOfFirstCheck);
            assertEditorText('change begin replacement end');
            done();
          });
        });
      });
    });
  });
});
