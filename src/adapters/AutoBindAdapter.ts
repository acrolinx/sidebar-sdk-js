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

import {Check, Match, MatchWithReplacement} from "@acrolinx/sidebar-interface";
import {AutobindConfig, bindAdaptersForCurrentPage} from '../autobind/autobind';
import {
  AdapterInterface,
  CommonAdapterConf,
  ContentExtractionResult,
  ExtractContentForCheckOpts,
  SuccessfulCheckResult
} from "./AdapterInterface";
import {MultiEditorAdapter, MultiEditorAdapterConfig} from "./MultiEditorAdapter";

export class AutoBindAdapter implements AdapterInterface {
  private multiAdapter!: MultiEditorAdapter;

  constructor(private conf: (MultiEditorAdapterConfig & CommonAdapterConf & AutobindConfig)) {
    this.initMultiAdapter();
  }

  private initMultiAdapter() {
    this.multiAdapter = new MultiEditorAdapter(this.conf);
  }

  getFormat() {
    return this.multiAdapter.getFormat();
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): Promise<ContentExtractionResult> {
    this.initMultiAdapter();
    bindAdaptersForCurrentPage(this.conf).forEach(adapter => {
      const wrapperAttributes = adapter.getAutobindWrapperAttributes ? adapter.getAutobindWrapperAttributes() : {};
      this.multiAdapter.addSingleAdapter(adapter, {attributes: wrapperAttributes});
    });
    return this.multiAdapter.extractContentForCheck(opts);
  }

  registerCheckCall(_checkInfo: Check) {
  }

  registerCheckResult(_checkResult: SuccessfulCheckResult) {
    this.multiAdapter.registerCheckResult(_checkResult);
  }

  selectRanges(checkId: string, matches: Match[]) {
    this.multiAdapter.selectRanges(checkId, matches);
  }

  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    this.multiAdapter.replaceRanges(checkId, matchesWithReplacement);
  }
}
