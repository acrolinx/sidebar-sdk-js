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

import {AdapterInterface} from "./AdapterInterface";
import {MultiEditorAdapter} from "./MultiEditorAdapter";
import {bindAdaptersForCurrentPage} from "../autobind/autobind";
import AcrolinxPluginConfig = acrolinx.plugins.AcrolinxPluginConfig;

export class AutoBindAdapter implements AdapterInterface {
  private multiAdapter: MultiEditorAdapter;
  private conf: AcrolinxPluginConfig;

  constructor(conf: AcrolinxPluginConfig) {
    this.conf = conf;
  }

  extractContentForCheck() {
    this.multiAdapter = new MultiEditorAdapter(this.conf);
    bindAdaptersForCurrentPage(this.conf).forEach(adapter => {
      const editorAttributes = adapter.getEditorAttributes ? adapter.getEditorAttributes() : {};
      const wrapperAttributes = _.mapKeys(editorAttributes, (_value, key) => 'original-' + key);
      this.multiAdapter.addSingleAdapter(adapter, {attributes: wrapperAttributes});
    });
    return this.multiAdapter.extractContentForCheck();
  }

  registerCheckCall(_checkInfo: acrolinx.sidebar.Check) {
  }

  registerCheckResult(_checkResult: acrolinx.sidebar.CheckResult) {
  }

  selectRanges(checkId: string, matches: acrolinx.sidebar.Match[]) {
    this.multiAdapter.selectRanges(checkId, matches);
  }

  replaceRanges(checkId: string, matchesWithReplacement: acrolinx.sidebar.MatchWithReplacement[]) {
    this.multiAdapter.replaceRanges(checkId, matchesWithReplacement);
  }
}