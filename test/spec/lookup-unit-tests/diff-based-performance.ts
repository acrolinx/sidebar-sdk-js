/*
 * Copyright 2016-present Acrolinx GmbH
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

import { createOffsetMappingArray } from '../../../src/lookup/diff-based';
import { diff_match_patch } from 'diff-match-patch';
const assert = chai.assert;

function generateText(length: number) {
  const chars = '      abcdefghijcmnopqrstuvwxyz';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += chars[Math.floor(Math.random() * chars.length)];
  }
  return text;
}

function modifyTextRandomly(originalText: string, modifications: number) {
  let currentText = originalText;
  for (let i = 0; i < modifications; i++) {
    const insertPosition = Math.floor(Math.random() * currentText.length);
    currentText = currentText.slice(0, insertPosition) + generateText(5) + currentText.slice(insertPosition);
  }
  return currentText;
}

describe('lookup/diff-based-performance', function () {
  it('is fast', function () {
    const text1 = generateText(100000);
    const text2 = modifyTextRandomly(text1, 100);

    const startTime = Date.now();

    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(text1, text2);
    createOffsetMappingArray(diffs);

    const neededTimeMs = Date.now() - startTime;
    assert.isTrue(neededTimeMs < 20000);
  });
});
