/*
 * Copyright 2020-present Acrolinx GmbH
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

import { act } from 'react-dom/test-utils';
import ReactDOM from 'react-dom';
import React from 'react';
import App from './adapter-test-setups/draftjs-editor/draftApp';
import { assert } from 'chai';
import { getMatchesWithReplacement } from '../utils/test-utils';
import { AsyncContentEditableAdapter } from '../../src/adapters/AsyncContentEditableAdapter';
import { isSuccessfulContentExtractionResult } from '../../src/adapters/AdapterInterface';
import { waitMs } from '../../src/utils/utils';

// The content of draft editor is initialized from constants.
// The tests only cover selection as replacement is crrently not implemented the way it should
// be in state based editors.
describe('state-based-editors-async-adapters', function () {
  let rootContainer: Element;
  let editable: Element;
  const dummyCheckId = 'dummyCheckId';
  let adapter: AsyncContentEditableAdapter;
  beforeEach(() => {
    rootContainer = document.createElement('div');
    document.body.appendChild(rootContainer);
    act(() => {
      ReactDOM.render(<App />, rootContainer);
    });
    editable = document.querySelector('[contenteditable=true]') as Element;
    adapter = new AsyncContentEditableAdapter({ element: editable as HTMLElement });
  });

  afterEach(() => {
    document.body.removeChild(rootContainer);
  });

  const registerCheckResult = (text: string) => {
    adapter.registerCheckResult({
      checkedPart: {
        checkId: dummyCheckId,
        range: [0, text.length],
      },
    });
  };

  it('check content', async () => {
    const content = adapter.getContent();
    assert.isTrue(content.includes('test'));
  });

  it('select ranges', async () => {
    const extractionResult = await adapter.extractContentForCheck({});
    if (isSuccessfulContentExtractionResult(extractionResult)) {
      assert.isTrue(extractionResult.content.includes('test'));
      registerCheckResult(extractionResult.content);
      const selected = 'test';
      await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(extractionResult.content, selected, ''));
      await waitMs(0);
      assert.equal(window.getSelection()?.toString(), selected);
    } else {
      assert('Extraction failed');
    }
  });

  it('select ranges sequentially', async () => {
    const extractionResult = await adapter.extractContentForCheck({});
    if (isSuccessfulContentExtractionResult(extractionResult)) {
      assert.isTrue(extractionResult.content.includes('test'));
      registerCheckResult(extractionResult.content);

      const selected = 'test';
      await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(extractionResult.content, selected, ''));
      await waitMs(0);
      assert.equal(window.getSelection()?.toString(), selected);

      const selected2 = 'This';
      await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(extractionResult.content, selected2, ''));
      await waitMs(0);
      assert.equal(window.getSelection()?.toString(), selected2);

      const selected3 = 'conteent';
      await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(extractionResult.content, selected3, ''));
      await waitMs(0);
      assert.equal(window.getSelection()?.toString(), selected3);
    } else {
      assert('Extraction of content failed');
    }
  });

  it('replace ranges', async () => {
    let beforeInputEventCount = 0;
    editable.addEventListener('beforeinput', () => beforeInputEventCount++);
    let inputEventCount = 0;
    editable.addEventListener('input', () => inputEventCount++);
    const extractionResult = await adapter.extractContentForCheck({});
    if (isSuccessfulContentExtractionResult(extractionResult)) {
      assert.isTrue(extractionResult.content.includes('test'));
      registerCheckResult(extractionResult.content);
      const selected = 'test';
      const replacement = 'test2';
      await adapter.replaceRanges(
        dummyCheckId,
        getMatchesWithReplacement(extractionResult.content, selected, replacement),
      );
      await waitMs(0);
      const selection = window.getSelection()?.toString();
      assert.equal(selection, replacement);
      assert.equal(beforeInputEventCount, 1);
      assert.equal(inputEventCount, 1);
    } else {
      assert('Replacement failed');
    }
  });
});
