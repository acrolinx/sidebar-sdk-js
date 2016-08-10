/*
 *
 * * Copyright 2016 Acrolinx GmbH
 * *
 * * Licensed under the Apache License, Version 2.0 (the "License");
 * * you may not use this file except in compliance with the License.
 * * You may obtain a copy of the License at
 * *
 * * http://www.apache.org/licenses/LICENSE-2.0
 * *
 * * Unless required by applicable law or agreed to in writing, software
 * * distributed under the License is distributed on an "AS IS" BASIS,
 * * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * * See the License for the specific language governing permissions and
 * * limitations under the License.
 * *
 * * For more information visit: http://www.acrolinx.com
 *
 */

import {Check, CheckResult, Match, MatchWithReplacement} from "../acrolinx-libs/plugin-interfaces";
import {AdapterInterface, ContentExtractionResult} from "./AdapterInterface";
import {MultiEditorAdapter, MultiEditorAdapterConfig} from "./MultiEditorAdapter";
import {bindAdaptersForCurrentPage} from "../autobind/autobind";

export class AutoBindAdapter implements AdapterInterface {
  private multiAdapter: MultiEditorAdapter;
  private conf: MultiEditorAdapterConfig;

  constructor(conf: MultiEditorAdapterConfig) {
    this.conf = conf;
  }

  extractContentForCheck(): Promise<ContentExtractionResult> {
    this.multiAdapter = new MultiEditorAdapter(this.conf);
    bindAdaptersForCurrentPage(this.conf).forEach(adapter => {
      const wrapperAttributes = adapter.getAutobindWrapperAttributes ? adapter.getAutobindWrapperAttributes() : {};
      this.multiAdapter.addSingleAdapter(adapter, {attributes: wrapperAttributes});
    });
    return this.multiAdapter.extractContentForCheck();
  }

  registerCheckCall(_checkInfo: Check) {
  }

  registerCheckResult(_checkResult: CheckResult) {
  }

  selectRanges(checkId: string, matches: Match[]) {
    this.multiAdapter.selectRanges(checkId, matches);
  }

  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    this.multiAdapter.replaceRanges(checkId, matchesWithReplacement);
  }
}