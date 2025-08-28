/*
 * Copyright 2015-present Acrolinx GmbH
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

import { expect, describe, beforeEach, afterEach, it } from 'vitest';
import { AdapterInterface } from '../../src/adapters/AdapterInterface';
import { assertEditorText, givenATextAync, htmlStringToElements } from './utils/util';
import { isChrome } from '../../src/utils/detect-browser';
import { AbstractRichtextEditorAdapter } from '../../src/adapters/AbstractRichtextEditorAdapter';
import { containsEmptyTextNodes, getMatchesWithReplacement } from './utils/test-utils';
import { MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { dummyCheckId, NON_BREAKING_SPACE } from './adapter-setups/constants';
import { CKEditor4TestSetup } from './adapter-setups/ckeditor-4-setup';

describe('CKEditor 4 Adapter', async () => {
  let adapter: AdapterInterface;
  const adapterSpec = new CKEditor4TestSetup();

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

  it('Get initial text from editor element', async () => {
    assertEditorText(adapterSpec, adapter, 'initial text');
  });

  it('Get current text from editor element', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'current text', async () => {
      assertEditorText(adapterSpec, adapter, 'current text');
    });
  });

  it('Extract initial HTML from editor element', async () => {
    assertEditorText(adapterSpec, adapter, 'initial text');
  });

  it('Extract current HTML from editor element', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'current text', async () => {
      assertEditorText(adapterSpec, adapter, 'current text');
    });
  });

  it("Don't change surrounding words when replacing", async () => {
    console.log("Don't change surrounding words when replacing");
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
      assertEditorText(adapterSpec, adapter, 'wordOne wordTwoReplacement wordThree');
    });
  });

  it('Replace words in reverse order', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'wordThreeReplacement'));
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
      assertEditorText(adapterSpec, adapter, 'wordOne wordTwoReplacement wordThreeReplacement');
    });
  });

  it('Replace words in order', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', 'wordTwoReplacement'));
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'wordThreeReplacement'));
      assertEditorText(adapterSpec, adapter, 'wordOne wordTwoReplacement wordThreeReplacement');
    });
  });

  it('Replace second of the same word', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame wordSame wordThree', (text) => {
      const matchWithReplacement = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement');
      adapter.replaceRanges(dummyCheckId, [matchWithReplacement[1]]);
      assertEditorText(adapterSpec, adapter, 'wordOne wordSame wordSameReplacement wordThree');
    });
  });

  it('Replace first of the same word', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame wordSame wordThree', (text) => {
      const matchWithReplacement = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement');
      adapter.replaceRanges(dummyCheckId, [matchWithReplacement[0]]);
      assertEditorText(adapterSpec, adapter, 'wordOne wordSameReplacement wordSame wordThree');
    });
  });

  it('Replace the same word with word in between two times with different replacements', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame blubb wordSame wordThree', (text) => {
      const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement1');
      const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSameReplacement2');
      adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
      adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
      assertEditorText(adapterSpec, adapter, 'wordOne wordSameReplacement1 blubb wordSameReplacement2 wordThree');
    });
  });

  it('Replace the same word two times with different replacements', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame wordSame wordThree', (text) => {
      const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSame1');
      const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
      adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
      adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
      assertEditorText(adapterSpec, adapter, 'wordOne wordSame1 wordSame2 wordThree');
    });
  });

  it('Replace the same word two times with different replacements, where the first replacement is kinda long', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame wordSame wordThree', (text) => {
      const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSamelonglonglonglong1');
      const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
      adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
      adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
      assertEditorText(adapterSpec, adapter, 'wordOne wordSamelonglonglonglong1 wordSame2 wordThree');
    });
  });

  it('Replace the same word two times with different replacements in reverse oder', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordSame wordSame wordThree', (text) => {
      const matchWithReplacement1 = getMatchesWithReplacement(text, 'wordSame', 'wordSame1');
      const matchWithReplacement2 = getMatchesWithReplacement(text, 'wordSame', 'wordSame2');
      adapter.replaceRanges(dummyCheckId, [matchWithReplacement2[1]]);
      adapter.replaceRanges(dummyCheckId, [matchWithReplacement1[0]]);
      assertEditorText(adapterSpec, adapter, 'wordOne wordSame1 wordSame2 wordThree');
    });
  });

  it('Replace single character ","', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne, wordTwo', (text) => {
      const matchWithReplacement = getMatchesWithReplacement(text, ',', '');
      adapter.replaceRanges(dummyCheckId, matchWithReplacement);
      assertEditorText(adapterSpec, adapter, 'wordOne wordTwo');
    });
  });

  it('Replace single character space', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo', (text) => {
      const matchWithReplacement = getMatchesWithReplacement(text, ' ', '');
      adapter.replaceRanges(dummyCheckId, matchWithReplacement);
      assertEditorText(adapterSpec, adapter, 'wordOnewordTwo');
    });
  });

  it('Replace continues multi range', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'word0 blub mist word3', (text) => {
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

  it('Replace continues multi range with number in words', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'word0 blub1 mist2 word3', (text) => {
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

  it('Replace first and only char', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'x', (text) => {
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
      assertEditorText(adapterSpec, adapter, 'aa');
    });
  });

  it('Replace first and only word', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'xyz', async (text) => {
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'xyz', 'aa'));
      assertEditorText(adapterSpec, adapter, 'aa');
    });
  });

  it('Replace first char', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'x after', (text) => {
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
      assertEditorText(adapterSpec, adapter, 'aa after');
    });
  });

  it('Replace first word', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'xyz after', (text) => {
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'xyz', 'aa'));
      assertEditorText(adapterSpec, adapter, 'aa after');
    });
  });

  it('Replace single chars', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'y x f z u', (text) => {
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'x', 'aa'));
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'f', 'bb'));
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'z', 'cc'));
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'u', 'dd'));

      assertEditorText(adapterSpec, adapter, 'y aa bb cc dd');
    });
  });

  it('Replace inside a word', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'InsideAllWord', (text) => {
      const matchWithReplacement = getMatchesWithReplacement(text, 'All', '12345');
      adapter.replaceRanges(dummyCheckId, matchWithReplacement);

      assertEditorText(adapterSpec, adapter, 'Inside12345Word');
    });
  });

  it('Replace last word', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo', (text) => {
      const matchesWithReplacement = getMatchesWithReplacement(text, 'wordTwo', 'wordTw');
      adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

      assertEditorText(adapterSpec, adapter, 'wordOne wordTw');
    });
  });

  it('Replace last word with short word', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo', (text) => {
      const matchesWithReplacement = getMatchesWithReplacement(text, 'wordTwo', 'beer');
      adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

      assertEditorText(adapterSpec, adapter, 'wordOne beer');
    });
  });

  it('Replace discontinues multi range', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree wordFour', (text) => {
      const matchesWithReplacement = [
        getMatchesWithReplacement(text, 'wordOne', 'a')[0],
        getMatchesWithReplacement(text, 'wordThree', 'c')[0],
      ];
      adapter.replaceRanges(dummyCheckId, matchesWithReplacement);

      assertEditorText(adapterSpec, adapter, 'a wordTwo c wordFour');
    });
  });

  it('Replace with and after strange chars', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree wordFour', (text) => {
      const strangeChars = '[]()/&%$§"!\'*+~öäü:,;-<>|^°´`òê€@ß?={}µコンピュータ';
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', strangeChars));
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordThree', 'c'));
      // TODO: Depending on the document type, we should test for correct escaping.
      assertEditorText(adapterSpec, adapter, `wordOne ${strangeChars} c wordFour`);
    });
  });

  it('Replace with text looking like entities', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
      const entities = '&uuml;';
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', entities));
      assertEditorText(adapterSpec, adapter, `wordOne ${entities} wordThree`);
    });
  });

  it('Replace with text looking like html tags', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne wordTwo wordThree', (text) => {
      const replacement = '<tagish>';
      adapter.replaceRanges(dummyCheckId, getMatchesWithReplacement(text, 'wordTwo', replacement));
      assertEditorText(adapterSpec, adapter, `wordOne ${replacement} wordThree`);
    });
  });

  it('Replace word containing entity', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'wordOne D&amp;D wordThree', (html) => {
      const replacement = 'Dungeons and Dragons';
      const matchesWithReplacement = getMatchesWithReplacement(html, 'D&amp;D', replacement);
      matchesWithReplacement[0].content = 'D&D';
      adapter.selectRanges(dummyCheckId, matchesWithReplacement);
      adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
      assertEditorText(adapterSpec, adapter, `wordOne ${replacement} wordThree`);
    });
  });

  it('Replace word before entity &nbsp;', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'Southh&nbsp;is warm.', (html) => {
      const replacement = 'South';
      const matchesWithReplacement = getMatchesWithReplacement(html, 'Southh', replacement);
      adapter.selectRanges(dummyCheckId, matchesWithReplacement);
      adapter.replaceRanges(dummyCheckId, matchesWithReplacement);
      assertEditorText(adapterSpec, adapter, `${replacement}${NON_BREAKING_SPACE}is warm.`);
    });
  });

  it('Replace words containing entity &nbsp;', async () => {
    await givenATextAync(adapter, adapterSpec, dummyCheckId, 'South&nbsp;is warm&nbsp;.', (html) => {
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
});
