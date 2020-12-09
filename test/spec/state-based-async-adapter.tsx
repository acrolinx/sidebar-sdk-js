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
import { bindAdaptersForCurrentPage } from '../../src/autobind/autobind';
import { assert } from 'chai';
import { getMatchesWithReplacement } from '../utils/test-utils';

// The content of draft editor is initialized from constants.
describe('state-based-editors-async-adapters', function () {

  let rootContainer: Element
  const dummyCheckId = 'dummyCheckId';
  beforeEach(() => {
    rootContainer = document.createElement("div");
    document.body.appendChild(rootContainer);
    act(() => {
      ReactDOM.render(<App />, rootContainer);
    });
  });

  afterEach(() => {
    document.body.removeChild(rootContainer);
  });

  it('select ranges', async () => {

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 1);

    adapters.forEach(async adapter => {
      const content = adapter.getContent!({});
      const selected = 'tesst';
      await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(content, selected, ''));
      assert.equal(document.getSelection()!.toString(), selected);
    });
  });

  it('select ranges sequentially', async () => {

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 1);

    adapters.forEach(async adapter => {
      const content = adapter.getContent!({});
      const selected1 = 'test';
      await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(content, selected1, ''));
      assert.equal(document.getSelection()!.toString(), selected1);

      const selected2 = 'content';
      await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(content, selected2, ''));
      assert.equal(document.getSelection()!.toString(), selected2);

      const selected3 = 'This';
      await adapter.selectRanges(dummyCheckId, getMatchesWithReplacement(content, selected3, ''));
      assert.equal(document.getSelection()!.toString(), selected3);
    });
  });

});


