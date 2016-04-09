/*
 *
 * * Copyright 2015 Acrolinx GmbH
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

namespace acrolinx.plugins.adapter {
  'use strict';

  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import Match = acrolinx.sidebar.Match;
  import CheckResult = acrolinx.sidebar.CheckResult;
  import Check = acrolinx.sidebar.Check;

  import _ = acrolinxLibs._;


  interface RemappedMatches {
    matches: MatchWithReplacement[];
    adapter: AdapterInterface;
  }

  interface RegisteredAdapter {
    id: string;
    adapter: AdapterInterface;
    wrapper: string;
    start?: number;
    end?: number;
  }

  export class MultiEditorAdapter implements AdapterInterface {
    config: AcrolinxPluginConfig;
    adapters: RegisteredAdapter[];
    checkResult: CheckResult;

    constructor(conf: AcrolinxPluginConfig) {
      this.config = conf;
      this.adapters = [];
    }

    addSingleAdapter(singleAdapter: AdapterInterface, wrapper = 'div', id = 'acrolinx_integration' + this.adapters.length) {
      this.adapters.push({id: id, adapter: singleAdapter, wrapper: wrapper});
    }

    getWrapperTag(wrapper: string) {
      return wrapper.split(' ')[0];
    }

    extractHTMLForCheck() {
      const Q = acrolinxLibs.Q;
      const deferred = Q.defer();
      const htmlResults = this.adapters.map(adapter => adapter.adapter.extractHTMLForCheck());
      Q.all(htmlResults).then((results: HtmlResult[]) => {
        let html = '';
        for (let i = 0; i < this.adapters.length; i++) {
          const el = this.adapters[i];
          const tag = this.getWrapperTag(el.wrapper);
          const startText = '<' + el.wrapper + ' id="' + el.id + '">';
          const elHtml = results[i].html;
          const newTag = startText + elHtml + '</' + tag + '>';
          el.start = html.length + startText.length;
          el.end = html.length + startText.length + elHtml.length;
          html += newTag;
        }
        deferred.resolve({html});
      });
      return deferred.promise;
    }

    registerCheckCall(checkInfo: Check) {
    }

    registerCheckResult(checkResult: CheckResult): void {
      this.checkResult = checkResult;
      this.adapters.forEach(entry => {
        entry.adapter.registerCheckResult(checkResult);
      });
    }

    selectRanges(checkId: string, matches: Match[]) {
      const map = this.remapMatches(matches);
      for (let id in map) {
        map[id].adapter.selectRanges(checkId, map[id].matches);
      }
    }

    remapMatches<T extends Match>(matches: T[]) {
      const map: {[id: string]: RemappedMatches } = {};
      for (const match of matches) {
        const adapter = this.getAdapterForMatch(match);
        if (!map.hasOwnProperty(adapter.id)) {
          map[adapter.id] = {matches: [], adapter: adapter.adapter};
        }
        const remappedMatch = _.clone(match);
        remappedMatch.range = match.range.map(x => x - adapter.start);
        map[adapter.id].matches.push(remappedMatch);
      }
      return map;
    }

    getAdapterForMatch(match: Match) {
      return _.find(this.adapters,
        (adapter: RegisteredAdapter) => (match.range[0] >= adapter.start) && (match.range[1] <= adapter.end));
    }

    replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
      const map = this.remapMatches(matchesWithReplacement);
      for (let id in map) {
        map[id].adapter.replaceRanges(checkId, map[id].matches);
      }
    }

  }
}