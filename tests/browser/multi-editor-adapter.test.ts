/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * Copyright 2017-present Acrolinx GmbH
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

import { Match, Check, CheckResult, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { describe, beforeEach, expect, it } from 'vitest';
import {
  AdapterInterface,
  ContentExtractionResult,
  SuccessfulContentExtractionResult,
  isSuccessfulContentExtractionResult,
} from '../../src/adapters/AdapterInterface';
import { MultiEditorAdapter } from '../../src/adapters/MultiEditorAdapter';
import { getMatchesWithReplacement } from './utils/test-utils';

class MockedAdapter implements AdapterInterface {
  selectRangesCount = 0;
  lastSelectedRanges!: Match[];

  constructor(public content = '') {}

  registerCheckCall(_checkInfo: Check): void {}

  registerCheckResult(_checkResult: CheckResult): void {}

  selectRanges(_checkId: string, matches: Match[]): void {
    console.log('selectedMatches', matches);
    expect(this.content.length).toBeGreaterThan(0);
    this.selectRangesCount += 1;
    this.lastSelectedRanges = matches;
  }

  replaceRanges(_checkId: string, _matchesWithReplacement: MatchWithReplacement[]): void {}

  extractContentForCheck(): ContentExtractionResult {
    return { content: this.content };
  }
}

describe('multi-editor-adapter', () => {
  describe('check 2 times, first adapter gets empty', async () => {
    const adapter2Content = 'Content2';
    let multiAdapter: MultiEditorAdapter;
    let extractionResult1: SuccessfulContentExtractionResult;
    let extractionResult2: SuccessfulContentExtractionResult;
    let adapter2: MockedAdapter;
    let expectedWrappedContent2: string;

    beforeEach(async () => {
      multiAdapter = new MultiEditorAdapter({});
      const adapter1 = new MockedAdapter('Content1');
      adapter2 = new MockedAdapter(adapter2Content);
      multiAdapter.addSingleAdapter(adapter1);
      multiAdapter.addSingleAdapter(adapter2);

      // Check the first time when adapter 1 has some content
      extractionResult1 = (await multiAdapter.extractContentForCheck({})) as SuccessfulContentExtractionResult;
      if (!isSuccessfulContentExtractionResult(extractionResult1)) {
        expect(false).toBe(true);
        return;
      }
      expect(extractionResult1.content).toBe(
        `<div id="acrolinx_integration0">Content1</div><div id="acrolinx_integration1">${adapter2Content}</div>`,
      );
      multiAdapter.registerCheckResult({
        checkedPart: {
          checkId: 'dummyCheckId',
          range: [0, extractionResult1.content.length],
        },
      });

      // Check the second time when adapter 1 has no content
      adapter1.content = '';
      extractionResult2 = (await multiAdapter.extractContentForCheck({})) as SuccessfulContentExtractionResult;
      expect(isSuccessfulContentExtractionResult(extractionResult2)).toBeTruthy();
      expectedWrappedContent2 = `<div id="acrolinx_integration0"></div><div id="acrolinx_integration1">${adapter2Content}</div>`;
      expect(extractionResult2.content).toBe(expectedWrappedContent2);
    });

    it('maps correctly based on first extraction, if second check check has not finished', async () => {
      multiAdapter.selectRanges('dummyCheckId', getMatchesWithReplacement(extractionResult1.content, adapter2Content));

      expect(adapter2.selectRangesCount).toBe(1);

      expect(adapter2.lastSelectedRanges[0].content).toEqual(adapter2Content);
      expect(adapter2.lastSelectedRanges[0].range).toEqual([0, adapter2Content.length]);
    });

    it('maps correctly if first adapter gets empty', async () => {
      multiAdapter.registerCheckResult({
        checkedPart: {
          checkId: 'dummyCheckId',
          range: [0, extractionResult2.content.length],
        },
      });

      multiAdapter.selectRanges('dummyCheckId', getMatchesWithReplacement(expectedWrappedContent2, adapter2Content));

      expect(adapter2.selectRangesCount).toBe(1);
      expect(adapter2.lastSelectedRanges[0].content).toEqual(adapter2Content);
      expect(adapter2.lastSelectedRanges[0].range).toEqual([0, adapter2Content.length]);
    });
  });

  it('getFormat returns config.aggregateFormat', () => {
    const multiAdapter = new MultiEditorAdapter({ aggregateFormat: 'AUTO' });
    expect(multiAdapter.getFormat()).toBe('AUTO');
  });

  it('getFormat returns HTML as default', () => {
    expect(new MultiEditorAdapter().getFormat()).toBe('HTML');
  });
});
