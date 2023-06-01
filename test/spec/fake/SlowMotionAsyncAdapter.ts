/*
 * Copyright 2018-present Acrolinx GmbH
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

import { Check, Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import {
  AdapterInterface,
  AsyncAdapterInterface,
  AutobindWrapperAttributes,
  ContentExtractionResult,
  ExtractContentForCheckOpts,
  SuccessfulCheckResult,
} from '../../../src/adapters/AdapterInterface';
import { waitMs } from '../../utils/test-utils';

export class SlowMotionAsyncWrapper implements AsyncAdapterInterface {
  public readonly isAsync = true;
  public readonly requiresSynchronization = true;

  public readonly getAutobindWrapperAttributes?: () => AutobindWrapperAttributes;
  public readonly getFormat?: () => string;

  constructor(private readonly adapter: AdapterInterface, public readonly delayMs: number) {
    if (adapter.getAutobindWrapperAttributes) {
      this.getAutobindWrapperAttributes = adapter.getAutobindWrapperAttributes.bind(adapter);
    }
    if (adapter.getFormat) {
      this.getFormat = adapter.getFormat.bind(adapter);
    }
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): ContentExtractionResult | Promise<ContentExtractionResult> {
    return this.adapter.extractContentForCheck(opts);
  }

  registerCheckCall(checkInfo: Check): void {
    return this.adapter.registerCheckCall(checkInfo);
  }

  registerCheckResult(checkResult: SuccessfulCheckResult): void {
    return this.adapter.registerCheckResult(checkResult);
  }

  async selectRanges(checkId: string, matches: Match[]): Promise<void> {
    await waitMs(this.delayMs);
    return this.adapter.selectRanges(checkId, matches);
  }

  async replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): Promise<void> {
    await waitMs(this.delayMs);
    return this.adapter.replaceRanges(checkId, matchesWithReplacement);
  }
}
