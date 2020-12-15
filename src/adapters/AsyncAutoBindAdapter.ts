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

import {Check, Match, MatchWithReplacement} from "@acrolinx/sidebar-interface";
import {AutobindConfig, bindAdaptersForCurrentPage} from '../autobind/autobind';
import {
  AsyncAdapterInterface,
  CommonAdapterConf,
  ContentExtractionResult,
  ExtractContentForCheckOpts,
  SuccessfulCheckResult
} from "./AdapterInterface";
import {MultiEditorAdapterConfig} from "./MultiEditorAdapter";
import {AsyncMultiEditorAdapter} from "./AsyncMultiEditorAdapter";

// While making changes here make sure if you also need to do them in synchronous version
// of this adapter
export class AsyncAutoBindAdapter implements AsyncAdapterInterface {
  readonly isAsync: true = true;
  readonly requiresSynchronization: true = true;
  private asyncMultiAdapter!: AsyncMultiEditorAdapter;

  constructor(private conf: (MultiEditorAdapterConfig & CommonAdapterConf & AutobindConfig)) {
    this.initMultiAdapter();
  }

  private initMultiAdapter() {
    this.asyncMultiAdapter = new AsyncMultiEditorAdapter(this.conf);
  }

  getFormat() {
    return this.asyncMultiAdapter.getFormat();
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): Promise<ContentExtractionResult> {
    this.initMultiAdapter();
    bindAdaptersForCurrentPage(this.conf).forEach(adapter => {
      const wrapperAttributes = adapter.getAutobindWrapperAttributes ? adapter.getAutobindWrapperAttributes() : {};
      this.asyncMultiAdapter.addSingleAdapter(adapter, {attributes: wrapperAttributes});
    });
    return this.asyncMultiAdapter.extractContentForCheck(opts);
  }

  registerCheckCall(_checkInfo: Check) {
  }

  registerCheckResult(_checkResult: SuccessfulCheckResult) {
    this.asyncMultiAdapter.registerCheckResult(_checkResult);
  }

  async selectRanges(checkId: string, matches: Match[]): Promise<void> {
    await this.asyncMultiAdapter.selectRanges(checkId, matches);
  }

  async replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): Promise<void> {
    await this.asyncMultiAdapter.replaceRanges(checkId, matchesWithReplacement);
  }
}
