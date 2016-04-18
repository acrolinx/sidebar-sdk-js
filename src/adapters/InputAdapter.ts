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

/// <reference path="../utils/utils.ts" />

namespace acrolinx.plugins.adapter {
  'use strict';

  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import Match = acrolinx.sidebar.Match;
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;
  import lookupMatches = acrolinx.plugins.lookup.diffbased.lookupMatches;
  import _ = acrolinxLibs._;
  import Check = acrolinx.sidebar.Check;
  import CheckResult = acrolinx.sidebar.CheckResult;
  import getCompleteFlagLength = acrolinx.plugins.utils.getCompleteFlagLength;

  type ValidInputElement = HTMLInputElement | HTMLTextAreaElement

  export class InputAdapter implements AdapterInterface {
    element: ValidInputElement;
    html: string;
    currentHtmlChecking: string;

    constructor(elementOrConf: ValidInputElement | AdapterConf) {
      if (elementOrConf instanceof Element) {
        this.element = elementOrConf;
      } else {
        const conf = elementOrConf as AdapterConf;
        this.element = document.getElementById(conf.editorId) as ValidInputElement;
      }
    }

    getHTML() {
      return this.element.value;
    }

    getCurrentText() {
      return this.getHTML();
    }

    getFormat() {
      return 'TEXT';
    }

    extractHTMLForCheck() {
      this.html = this.getHTML();
      this.currentHtmlChecking = this.html;
      return {html: this.html} as HtmlResult;
    }

    registerCheckResult(checkResult: CheckResult): void {
    }

    registerCheckCall(checkInfo: Check) {
    }

    scrollAndSelect(matches: AlignedMatch<Match>[]) {
      const newBegin = matches[0].range[0];
      const matchLength = getCompleteFlagLength(matches);
      const el = this.element;

      if (el.clientHeight < el.scrollHeight) {
        // This funny trick causes scrolling inside of the textarea.
        const text = this.element.value;
        el.blur();
        el.value = text.slice(0, newBegin);
        el.focus();
        el.value = text;
      } 

      el.setSelectionRange(newBegin, newBegin + matchLength);
      el.scrollIntoView();
    }

    selectRanges(checkId: string, matches: Match[]) {
      this.selectMatches(checkId, matches);
    }

    selectMatches<T extends Match>(checkId: string, matches: T[]): AlignedMatch<T>[] {
      const alignedMatches = lookupMatches(this.currentHtmlChecking, this.getCurrentText(), matches, 'TEXT');

      if (_.isEmpty(alignedMatches)) {
        throw 'Selected flagged content is modified.';
      }

      this.scrollAndSelect(alignedMatches);
      return alignedMatches;
    }

    replaceAlignedMatches(matches: AlignedMatch<MatchWithReplacement>[]) {
      const reversedMatches = _.clone(matches).reverse();
      const el = this.element;
      let text = el.value;
      for (let match of reversedMatches) {
        text = text.slice(0, match.range[0]) + match.originalMatch.replacement + text.slice(match.range[1]);
      }
      el.value = text;
    }

    replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
      const alignedMatches = this.selectMatches(checkId, matchesWithReplacement);
      this.scrollAndSelect(alignedMatches);
      this.replaceAlignedMatches(alignedMatches);
      const startOfSelection = alignedMatches[0].range[0];
      const replacement = alignedMatches.map(m => m.originalMatch.replacement).join('');
      this.element.setSelectionRange(startOfSelection, startOfSelection + replacement.length);
    }
  }
}