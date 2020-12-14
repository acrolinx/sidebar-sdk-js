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

import _ from 'lodash';
import { act } from 'react-dom/test-utils';
import ReactDOM from "react-dom";
import React from 'react';
import App from './adapter-test-setups/draftjs-editor/draftApp';
import { assert } from 'chai';
import { getMatchesWithReplacement } from '../utils/test-utils';
import { AsyncContentEditableAdapter } from '../../src/adapters/AsyncContentEditableAdapter';
import { isSuccessfulContentExtractionResult } from '../../src/adapters/AdapterInterface';
import { waitMs } from '../../src/utils/utils';

// The content of draft editor is initialized from constants.
describe('state-based-editors-async-adapters', function () {

  let rootContainer: Element
  const dummyCheckId = 'dummyCheckId';
  let adapter: AsyncContentEditableAdapter;
  beforeEach(() => {
    rootContainer = document.createElement("div");
    document.body.appendChild(rootContainer);
    act(() => {
      ReactDOM.render(<App />, rootContainer);
    });
    const editable = document.querySelector('[contenteditable=true]');
    adapter = new AsyncContentEditableAdapter({ element: editable as HTMLElement });
  });

  afterEach(() => {
    document.body.removeChild(rootContainer);
  });

  const registerCheckResult = (text: string) => {
    adapter.registerCheckResult({
      checkedPart: {
        checkId: dummyCheckId,
        range: [0, text.length]
      }
    });
  }

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
      assert.equal(document.getElementById('selection')?.innerText, selected);
    } else {
      assert('Extraction failed');
    }
  });

  it('select ranges sequentially', async () => {
    let extractionResult = await adapter.extractContentForCheck({});
    if (isSuccessfulContentExtractionResult(extractionResult)) {
      assert.isTrue(extractionResult.content.includes('test'));
      registerCheckResult(extractionResult.content);

      const selected = 'test';
      await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(extractionResult.content, selected, ''));
      await waitMs(0);
      assert.equal(document.getElementById('selection')?.innerText, selected);

      const selected2 = 'This';
      await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(extractionResult.content, selected2, ''));
      await waitMs(0);
      assert.equal(document.getElementById('selection')?.innerText, selected2);

      const selected3 = 'conteent';
      await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(extractionResult.content, selected3, ''));
      await waitMs(0);
      assert.equal(document.getElementById('selection')?.innerText, selected3);
    }
    else {
      assert('Extraction of content failed')
    }
  });
});


