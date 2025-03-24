/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, describe, beforeEach, afterEach, it, assert } from 'vitest';
import { AdapterInterface, SuccessfulContentExtractionResult } from '../../src/adapters/adapter-interface';
import { AdapterTestSetup } from './adapter-setups/adapter-setup';
import { ContentEditableTestSetup } from './adapter-setups/content-editable-setup';
import _ from 'lodash';
import {
  assertEditorRawContent,
  assertEditorText,
  givenAText,
  givenATextWithoutCheckResult,
  htmlStringToElements,
  normalizeResultHtml,
  registerCheckResult,
} from './utils/util';
import { isChrome } from '../../src/utils/detect-browser';
import { AbstractRichtextEditorAdapter } from '../../src/adapters/abstract-rich-text-editor-adapter';
import { containsEmptyTextNodes, getMatchesWithReplacement, testIfWindowIsFocused } from './utils/test-utils';
import { MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { InputAdapterTestSetup } from './adapter-setups/input-adapter-test-setup';
import { CodeMirror6TestSetup } from './adapter-setups/codemirror-6-test-setup';
import { TinyMCETestSetup } from './adapter-setups/tinymce-adapter-test-setup';
import { QuillContentEditableTestSetup } from './adapter-setups/quill-adapter-test-setup';

describe('adapter tests', () => {
  const NON_BREAKING_SPACE = '\u00a0';
  let adapter: AdapterInterface;

  const dummyCheckId = 'dummyCheckId';

  const adapters: AdapterTestSetup[] = [
    new ContentEditableTestSetup(),
    new InputAdapterTestSetup(),
    new CodeMirror6TestSetup({
      mode: 'text/html',
      name: 'CodeMirrorAdapterHTML',
      inputFormat: 'HTML',
    }),
    new TinyMCETestSetup(),
    new QuillContentEditableTestSetup(),
  ];

  const testedAdapterNames: string[] = []; // empty = all
  const testedAdapters: AdapterTestSetup[] = adapters.filter(
    (a) => _.isEmpty(testedAdapterNames) || _.includes(testedAdapterNames, a.name),
  );

  testedAdapters.forEach((adapterSpec) => {
    const adapterName = adapterSpec.name;

    describe('adapter ' + adapterName, () => {
      beforeEach(async () => {
        const body = document.getElementsByTagName('body')[0];
        body.appendChild(htmlStringToElements(adapterSpec.editorElement));
        adapter = await adapterSpec.init();
      });

      afterEach(async () => {
        const containsUnwantedEmptyTextNodes =
          isChrome() &&
          adapter instanceof AbstractRichtextEditorAdapter &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          containsEmptyTextNodes((adapter as any).getEditorElement());

        await adapterSpec.remove();
        expect(containsUnwantedEmptyTextNodes).toBeFalsy();
      });

      it('Get initial text from editor element', () => {
        assertEditorText(adapterSpec, adapter, 'initial text');
      });

      it('Get current text from editor element', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'current text', () => {
          assertEditorText(adapterSpec, adapter, 'current text');
        });
      });

      it('Extract initial HTML from editor element', () => {
        assertEditorText(adapterSpec, adapter, 'initial text');
      });

      it('Extract current HTML from editor element', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'current text', () => {
          assertEditorText(adapterSpec, adapter, 'current text');
        });
      });

      it("Don't change surrounding words when replacing", () => {
        console.log("Don't change surrounding words when replacing");
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          assertEditorText(adapterSpec, adapter, 'wordOne wordTwoReplacement wordThree');
        });
      });

      if (adapterSpec instanceof ContentEditableTestSetup) {
        it('Replacements should trigger an input event', () => {
          givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
            adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
            expect(adapterSpec.inputEventWasTriggered).toBeTruthy();
          });
        });
      }

      if (adapterSpec instanceof ContentEditableTestSetup) {
        it('beforeinput and input events should be trigerred', () => {
          givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
            adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
            expect(adapterSpec.beforeInputEventWasTriggered).toBeTruthy();
          });
        });
      }

      it('Replace words in reverse order', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'wordThreeReplacement'));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          assertEditorText(adapterSpec, adapter, 'wordOne wordTwoReplacement wordThreeReplacement');
        });
      });

      it('Replace words in order', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'wordThreeReplacement'));
          assertEditorText(adapterSpec, adapter, 'wordOne wordTwoReplacement wordThreeReplacement');
        });
      });

      it('Replace second of the same word', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame wordSame wordThree', (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement[1]]);
          assertEditorText(adapterSpec, adapter, 'wordOne wordSame wordSameReplacement wordThree');
        });
      });

      it('Replace first of the same word', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame wordSame wordThree', (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement[0]]);
          assertEditorText(adapterSpec, adapter, 'wordOne wordSameReplacement wordSame wordThree');
        });
      });

      it('Replace the same word with word in between two times with different replacements', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame blubb wordSame wordThree', (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText(adapterSpec, adapter, 'wordOne wordSameReplacement1 blubb wordSameReplacement2 wordThree');
        });
      });

      it('Replace the same word two times with different replacements', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame wordSame wordThree', (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText(adapterSpec, adapter, 'wordOne wordSame1 wordSame2 wordThree');
        });
      });

      it('Replace the same word two times with different replacements, where the first replacement is kinda long', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame wordSame wordThree', (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSamelonglonglonglong1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          assertEditorText(adapterSpec, adapter, 'wordOne wordSamelonglonglonglong1 wordSame2 wordThree');
        });
      });

      it('Replace the same word two times with different replacements in reverse oder', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame wordSame wordThree', (text) => {
          const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSame1');
          const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
          adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
          assertEditorText(adapterSpec, adapter, 'wordOne wordSame1 wordSame2 wordThree');
        });
      });

      it('Replace single character ","', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne, wordTwo', (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, ',', '');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          assertEditorText(adapterSpec, adapter, 'wordOne wordTwo');
        });
      });

      it('Replace single character space', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo', (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, ' ', '');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);
          assertEditorText(adapterSpec, adapter, 'wordOnewordTwo');
        });
      });

      it('Replace continues multi range', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'word0 blub mist word3', (text) => {
          const word1 = getMatchesWithReplacement(text, 'blub', 'a')[0];
          const word2 = getMatchesWithReplacement(text, 'mist', 'b')[0];
          const space = {
            content: ' ',
            replacement: '',
            range: [word1.range[1], word2.range[0]] as [number, number],
          };

          adapter.replaceRanges(dummyCheckId, [word1, space, word2]);
          assertEditorText(adapterSpec, adapter, 'word0 ab word3');
        });
      });

      it('Replace continues multi range with number in words', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'word0 blub1 mist2 word3', (text) => {
          const word1 = getMatchesWithReplacement(text, 'blub1', 'a')[0];
          const word2 = getMatchesWithReplacement(text, 'mist2', 'b')[0];
          const space = {
            content: ' ',
            replacement: '',
            range: [word1.range[1], word2.range[0]] as [number, number],
          };

          adapter.replaceRanges(dummyCheckId, [word1, space, word2]);
          assertEditorText(adapterSpec, adapter, 'word0 ab word3');
        });
      });

      it('Replace first and only char', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'x', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          assertEditorText(adapterSpec, adapter, 'aa');
        });
      });

      it('Replace first and only word', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'xyz', async (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'xyz', 'aa'));
          assertEditorText(adapterSpec, adapter, 'aa');
        });
      });

      it('Replace first char', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'x after', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          assertEditorText(adapterSpec, adapter, 'aa after');
        });
      });

      it('Replace first word', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'xyz after', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'xyz', 'aa'));
          assertEditorText(adapterSpec, adapter, 'aa after');
        });
      });

      it('Replace single chars', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'y x f z u', (text) => {
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'f', 'bb'));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'z', 'cc'));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'u', 'dd'));

          assertEditorText(adapterSpec, adapter, 'y aa bb cc dd');
        });
      });

      it('Replace inside a word', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'InsideAllWord', (text) => {
          const matchWithReplacement = getMatchesWithReplacement(text, 'All', '12345');
          adapter.replaceRanges(dummyCheckId, matchWithReplacement);

          assertEditorText(adapterSpec, adapter, 'Inside12345Word');
        });
      });

      it('Replace last word', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo', (text) => {
          const matchesWithReplacement = getMatchesWithReplacement(text, 'wordTwo', 'wordTw');
          adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

          assertEditorText(adapterSpec, adapter, 'wordOne wordTw');
        });
      });

      it('Replace last word with short word', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo', (text) => {
          const matchesWithReplacement = getMatchesWithReplacement(text, 'wordTwo', 'beer');
          adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

          assertEditorText(adapterSpec, adapter, 'wordOne beer');
        });
      });

      it('Replace discontinues multi range', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree wordFour', (text) => {
          const matchesWithReplacement = [
            getMatchesWithReplacement(text, 'wordOne', 'a')[0],
            getMatchesWithReplacement(text, 'wordThree', 'c')[0],
          ];
          adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

          assertEditorText(adapterSpec, adapter, 'a wordTwo c wordFour');
        });
      });

      it('Replace with and after strange chars', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree wordFour', (text) => {
          const strangeChars = '[]()/&%$§"!\'*+~öäü:,;-<>|^°´`òê€@ß?={}µコンピュータ';
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', strangeChars));
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'c'));
          // TODO: Depending on the document type, we should test for correct escaping.
          assertEditorText(adapterSpec, adapter, `wordOne ${strangeChars} c wordFour`);
        });
      });

      it('Replace with text looking like entities', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
          const entities = '&uuml;';
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', entities));
          assertEditorText(adapterSpec, adapter, `wordOne ${entities} wordThree`);
        });
      });

      it('Replace with text looking like html tags', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
          const replacement = '<tagish>';
          adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', replacement));
          assertEditorText(adapterSpec, adapter, `wordOne ${replacement} wordThree`);
        });
      });

      if (adapterSpec.inputFormat === 'TEXT') {
        it('Replace text inside tags', () => {
          givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne <part1 part2 part3/> wordThree', (text) => {
            const replacement = 'replacement';
            adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'part3', replacement));
            assertEditorText(adapterSpec, adapter, `wordOne <part1 part2 ${replacement}/> wordThree`);
          });
        });
      }

      it('Replace word containing entity', () => {
        if (adapterSpec.inputFormat === 'HTML') {
          givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne D&amp;D wordThree', (html) => {
            const replacement = 'Dungeons and Dragons';
            const matchesWithReplacement = getMatchesWithReplacement(html, 'D&amp;D', replacement);
            matchesWithReplacement[0].content = 'D&D';
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assertEditorText(adapterSpec, adapter, `wordOne ${replacement} wordThree`);
          });
        } else {
          givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne D&amp;D wordThree', (text) => {
            const replacement = 'Dungeons and Dragons';
            const matchesWithReplacement = getMatchesWithReplacement(text, 'D&amp;D', replacement);
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assertEditorText(adapterSpec, adapter, `wordOne ${replacement} wordThree`);
          });
        }
      });

      if (adapterSpec instanceof CodeMirror6TestSetup && adapterSpec.inputFormat == 'HTML') {
        it('Escape entities in replacement if codemirror is in html mode', () => {
          givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne and wordThree', (text) => {
            const replacement = '&';
            const matchesWithReplacement = getMatchesWithReplacement(text, 'and', replacement);
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assertEditorText(adapterSpec, adapter, `wordOne & wordThree`);
            assertEditorRawContent(adapter, 'wordOne &amp; wordThree');
          });
        });
      }

      if (adapterSpec instanceof InputAdapterTestSetup || adapterSpec instanceof CodeMirror6TestSetup) {
        it('Replace word containing entity in case of markdown', () => {
          givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne D&amp;D wordThree', (text) => {
            const replacement = 'Dungeons and Dragons';
            const matchesWithReplacement = getMatchesWithReplacement(text, 'D&amp;D', replacement);

            // In case of markdown, the server might replace the entities of matches with the corresponding char
            // but we must still find it.
            matchesWithReplacement[0].content = 'Dungeons & Dragons';

            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assertEditorText(adapterSpec, adapter, `wordOne ${replacement} wordThree`);
          });
        });

        it("Don't replace markup/markdown", () => {
          givenAText(adapter, adapterSpec, dummyCheckId, 'see  ![Acrolinx]', () => {
            const matchesWithReplacement: MatchWithReplacement[] = [
              { content: 'see', range: [0, 3], replacement: 'see Acrolinx' },
              { content: ' ', range: [3, 4], replacement: '' },
              { content: ' ', range: [4, 5], replacement: '' },
              { content: ' ', range: [5, 7], replacement: '' },
              { content: 'Acrolinx', range: [7, 15], replacement: '' },
            ];
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            // Actually we would like to get "see ![Acrolinx]" but this would need a better server response.
            assertEditorText(adapterSpec, adapter, 'see Acrolinx![]');
          });
        });
      }

      if (adapterSpec.inputFormat === 'HTML') {
        it('Replace word before entity &nbsp;', () => {
          givenAText(adapter, adapterSpec, dummyCheckId, 'Southh&nbsp;is warm.', (html) => {
            const replacement = 'South';
            const matchesWithReplacement = getMatchesWithReplacement(html, 'Southh', replacement);
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            assertEditorText(adapterSpec, adapter, `${replacement}${NON_BREAKING_SPACE}is warm.`);
          });
        });

        it('Replace words containing entity &nbsp;', () => {
          givenAText(adapter, adapterSpec, dummyCheckId, 'South&nbsp;is warm&nbsp;.', (html) => {
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
            assertEditorText(adapterSpec, adapter, `${replacement}${NON_BREAKING_SPACE}is warm.`);
          });
        });
      }

      it('Replace same word in correct order', () => {
        givenAText(
          adapter,
          adapterSpec,
          dummyCheckId,
          'before wordSame wordSame wordSame wordSame wordSame after',
          (text) => {
            // The diff approach can not always handle ["a", "b", "c", "d", "e"] correctly.
            const replacements = ['replacement1', 'replacement2', 'replacement3', 'replacement4', 'replacement5'];

            function replace(i: number) {
              adapter.replaceRanges(dummyCheckId, [getMatchesWithReplacement(text, 'wordSame', replacements[i])[i]]);
            }

            replace(0);
            replace(4);
            replace(2);
            replace(3);
            replace(1);

            assertEditorText(adapterSpec, adapter, `before ${replacements.join(' ')} after`);
          },
        );
      });

      it('selectRanges does not change text', () => {
        const words = ['wordOne', 'wordTwo', 'wordThree', 'wordFour'];
        const editorText = words.join(' ');
        givenAText(adapter, adapterSpec, dummyCheckId, editorText, (text) => {
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

          assertEditorText(adapterSpec, adapter, editorText);
        });
      });

      if (adapterSpec.inputFormat === 'HTML') {
        it('Remove complete text content', () => {
          givenAText(adapter, adapterSpec, dummyCheckId, '<p>a</p>', () => {
            const matchesWithReplacement: MatchWithReplacement[] = [{ content: 'a', range: [3, 4], replacement: '' }];
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            const normalizedResultHtml = normalizeResultHtml(adapter.getContent!({}));
            if (adapterSpec instanceof TinyMCETestSetup) {
              assert.equal(normalizedResultHtml, '');
            } else {
              assert.equal(normalizedResultHtml, '<p></p>');
            }
          });
        });

        if (adapterSpec instanceof QuillContentEditableTestSetup) {
          it('Missing space within p elements', () => {
            givenAText(adapter, adapterSpec, dummyCheckId, '<p>a b ?</p><p>c</p>', () => {
              const matchesWithReplacement: MatchWithReplacement[] = [
                { content: 'b', range: [5, 6], replacement: 'b?' },
                { content: ' ', range: [6, 7], replacement: '' },
                { content: '?', range: [7, 8], replacement: '' },
              ];
              adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
              assert.equal(normalizeResultHtml(adapter.getContent!({})), '<p>a b?</p><p>c</p>');
            });
          });
        } else {
          it('Missing space within divs', () => {
            givenAText(adapter, adapterSpec, dummyCheckId, '<div>a b ?</div><div>c</div>', () => {
              const matchesWithReplacement: MatchWithReplacement[] = [
                { content: 'b', range: [7, 8], replacement: 'b?' },
                { content: ' ', range: [8, 9], replacement: '' },
                { content: '?', range: [9, 10], replacement: '' },
              ];
              adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
              assert.equal(normalizeResultHtml(adapter.getContent!({})), '<div>a b?</div><div>c</div>');
            });
          });
        }

        it('Replace partially tagged text', () => {
          givenAText(adapter, adapterSpec, dummyCheckId, '<p><strong>a b</strong> .</p>', () => {
            const matchesWithReplacement: MatchWithReplacement[] = [
              { content: 'b', range: [13, 14], replacement: 'b.' },
              { content: ' ', range: [23, 24], replacement: '' },
              { content: '.', range: [24, 25], replacement: '' },
            ];
            adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
            expect(normalizeResultHtml(adapter.getContent!({}))).toEqual('<p><strong>a b.</strong></p>');
          });
        });
      }

      it('SelectRanges throws exception if matched document part has changed', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (html) => {
          const matchesWithReplacement = getMatchesWithReplacement(html, 'wordTwo');
          adapterSpec.setEditorContent('wordOne wordXTwo wordThree');
          expect(() => adapter.selectRanges(dummyCheckId, matchesWithReplacement)).toThrowError();
        });
      });

      it('ReplaceRanges throws exception if matched document part has changed', () => {
        givenAText(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (html) => {
          const matchesWithReplacement = getMatchesWithReplacement(html, 'wordTwo', 'replacement');
          adapterSpec.setEditorContent('wordOne wordXTwo wordThree');
          expect(() => adapter.replaceRanges(dummyCheckId, matchesWithReplacement)).toThrowError();
        });
      });

      if (adapterSpec instanceof ContentEditableTestSetup || adapterSpec instanceof InputAdapterTestSetup) {
        it('SelectRanges throws exception if editor gets removed', () => {
          const completeContent = 'wordOne';
          givenAText(adapter, adapterSpec, dummyCheckId, completeContent, (html) => {
            const matchesWithReplacement = getMatchesWithReplacement(html, 'wordOne');
            document.getElementById('editorId')!.remove();
            expect(() => adapter.selectRanges(dummyCheckId, matchesWithReplacement)).toThrowError();
          });
        });

        it('SelectRanges throws exception if editor gets hidden', () => {
          const completeContent = 'wordOne wordTwo wordThree';
          givenAText(adapter, adapterSpec, dummyCheckId, completeContent, (html) => {
            const matchesWithReplacement = getMatchesWithReplacement(html, 'wordTwo');
            document.getElementById('editorId')!.style.display = 'none';
            expect(() => adapter.selectRanges(dummyCheckId, matchesWithReplacement)).toThrowError();
          });
        });
      }

      if (
        adapterSpec instanceof ContentEditableTestSetup ||
        adapterSpec instanceof InputAdapterTestSetup ||
        adapterSpec instanceof CodeMirror6TestSetup ||
        adapterSpec instanceof TinyMCETestSetup
      ) {
        it('Return check selection if requested', () => {
          const completeContent = 'begin selection end';
          givenAText(adapter, adapterSpec, dummyCheckId, completeContent, (html) => {
            const matchesWithReplacement = getMatchesWithReplacement(html, 'selection');
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            // TODO: Investigate why we need a second selectRanges in IE11 (TinyMCEAdapter.scrollToCurrentSelection ?)
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);

            const result = adapter.extractContentForCheck({
              checkSelection: true,
            }) as SuccessfulContentExtractionResult;
            const selectedRanges = result.selection!.ranges;
            expect(selectedRanges.length).toEqual(1);
            expect(selectedRanges[0]).toEqual(matchesWithReplacement[0].range);
          });
        });
        it('Does not return check selection if not requested', () => {
          const completeContent = 'begin selection end';
          givenAText(adapter, adapterSpec, dummyCheckId, completeContent, (html) => {
            const matchesWithReplacement = getMatchesWithReplacement(html, 'selection');
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            const result = adapter.extractContentForCheck({
              checkSelection: false,
            }) as SuccessfulContentExtractionResult;
            expect(result.selection).toBeUndefined();
          });
        });
      }

      if (adapterSpec instanceof TinyMCETestSetup) {
        it('Return correct check selection if tags are filtered by tinyMCE', () => {
          const SELECTED_TEXT = 'selection';
          // The blink tag will be filter by setContent/getContent of tinyMCE, so we must set it with this trick.
          adapterSpec.getTinyMceEditor()!.getBody().innerHTML = '<blink>begin</blink> selection end';

          // We simulate a check only to set a selection.
          adapter.registerCheckCall({ checkId: dummyCheckId });
          const contentExtractionResult = adapter.extractContentForCheck({}) as SuccessfulContentExtractionResult;
          registerCheckResult(adapter, contentExtractionResult.content, dummyCheckId);
          const matchesWithReplacement = getMatchesWithReplacement(
            contentExtractionResult.content,
            SELECTED_TEXT,
            SELECTED_TEXT,
          );
          // TODO: Investigate why we need replaceRanges instead of selectRanges in IE11 (TinyMCEAdapter.scrollToCurrentSelection ?)
          // in order to select.
          adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
          assert.equal(adapterSpec.getSelectedText(), SELECTED_TEXT);

          // If we now extract content for checkSelection, the selection should be what we have set before.
          const result = adapter.extractContentForCheck({ checkSelection: true }) as SuccessfulContentExtractionResult;
          const selectedRanges = result.selection!.ranges;
          expect(selectedRanges.length).toEqual(1);
          expect(selectedRanges[0]).toEqual(matchesWithReplacement[0].range);
          expect(result.content.slice(selectedRanges[0][0], selectedRanges[0][1])).toEqual(SELECTED_TEXT);
        });
      }

      if (
        adapterSpec instanceof ContentEditableTestSetup ||
        adapterSpec instanceof TinyMCETestSetup ||
        adapterSpec instanceof QuillContentEditableTestSetup
      ) {
        // This test cares for a bug that caused an additional "span" tag
        // in IE 11
        it('selectRanges should not change the document', () => {
          const completeContent = 'begin selection end';
          givenAText(adapter, adapterSpec, dummyCheckId, completeContent, (initialExtractedContent) => {
            const matchesWithReplacement = getMatchesWithReplacement(initialExtractedContent, 'selection');
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            assertEditorRawContent(adapter, initialExtractedContent);
          });
        });
      }

      describe('selectRanges', () => {
        testIfWindowIsFocused('should select the correct text', () => {
          const completeContent = '<p>begin selection end</p>';
          givenAText(adapter, adapterSpec, dummyCheckId, completeContent, (initialExtractedContent) => {
            const matchesWithReplacement = getMatchesWithReplacement(initialExtractedContent, 'selection');
            adapter.selectRanges(dummyCheckId, matchesWithReplacement);
            expect(adapterSpec.getSelectedText()).toEqual('selection');

            // We wait because some editors (Quill) modify the document/selection after they recognize changes.
            // If we would not wait everything would seems fine, but it reality it would be broken.
          });
        });
      });

      if (adapterSpec instanceof ContentEditableTestSetup || adapterSpec instanceof QuillContentEditableTestSetup) {
        // testIf(isWindowFocused(), 'selectRanges in quill centers in good browsers', () => {
        //   const dummyLines = _.repeat('<p>dummy line</p>', 100);
        //   const completeContent = dummyLines + '<p>middle</p>' + dummyLines;
        //   givenAText(completeContent, (initialExtractedContent) => {
        //     const matchesWithReplacement = getMatchesWithReplacement(initialExtractedContent, 'middle');
        //     adapter.selectRanges(dummyCheckId, matchesWithReplacement);
        //     expect(adapterSpec.getSelectedText()).toEqual('middle');
        //     const paragraphs = document.querySelectorAll('p');
        //     let relativeTop = 0;
        //     for (const paragraph of paragraphs) {
        //       if (paragraph.textContent!.includes('middle')) {
        //         const rect = paragraph.getBoundingClientRect();
        //         relativeTop = rect.top + window.scrollY;
        //         break;
        //       }
        //     }
        //     //const relativeTop = jQuery('p:contains("middle")').position().top;
        //     console.warn(relativeTop);
        //     if (isScrollIntoViewCenteredAvailable()) {
        //       assert.approximately(relativeTop, EDITOR_HEIGHT / 2, 30, 'position should be vertically centered');
        //     } else {
        //       assert.approximately(relativeTop, 10, 10, 'position should be at top');
        //     }
        //   });
        // });
      }

      describe('previous successful check, but current check has not finished', () => {
        let matchesWithReplacementOfFirstCheck: MatchWithReplacement[];
        beforeEach(() => {
          const completeContent = 'begin selection end';
          givenAText(adapter, adapterSpec, dummyCheckId, completeContent, (initialExtractedContent) => {
            matchesWithReplacementOfFirstCheck = getMatchesWithReplacement(
              initialExtractedContent,
              'selection',
              'replacement',
            );
          });
        });

        testIfWindowIsFocused('selects ranges of previous check', () => {
          const completeNewContent = 'change begin selection end';
          givenATextWithoutCheckResult(
            adapter,
            adapterSpec,
            completeNewContent,
            dummyCheckId,
            (_initialExtractedContent) => {
              adapter.selectRanges(dummyCheckId, matchesWithReplacementOfFirstCheck);
              const selectedText = adapterSpec.getSelectedText();
              expect(selectedText).toEqual('selection');
            },
          );
        });

        it('replaces ranges of previous check', () => {
          const completeNewContent = 'change begin selection end';
          givenATextWithoutCheckResult(
            adapter,
            adapterSpec,
            completeNewContent,
            dummyCheckId,
            (_initialExtractedContent) => {
              adapter.replaceRanges(dummyCheckId, matchesWithReplacementOfFirstCheck);
              assertEditorText(adapterSpec, adapter, 'change begin replacement end');
            },
          );
        });
      });
    });
  });
});
