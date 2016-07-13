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


import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
import Match = acrolinx.sidebar.Match;
import {_} from "../acrolinx-libs/acrolinx-libs-defaults";
import {getElementFromAdapterConf, AdapterInterface, AdapterConf, ContentExtractionResult} from "./AdapterInterface";
import {AlignedMatch} from "../utils/alignment";
import {getCompleteFlagLength} from "../utils/match";
import {scrollIntoView} from "../utils/scrolling";
import {lookupMatches} from "../lookup/diff-based";
import {fakeInputEvent} from "../utils/utils";
import Check = acrolinx.sidebar.Check;
import CheckResult = acrolinx.sidebar.CheckResult;

type ValidInputElement = HTMLInputElement | HTMLTextAreaElement

export class InputAdapter implements AdapterInterface {
  element: ValidInputElement;
  config: AdapterConf;
  html: string;
  currentHtmlChecking: string;

  constructor(conf: AdapterConf) {
    this.element = getElementFromAdapterConf(conf) as ValidInputElement;
    this.config = conf;
  }

  getContent() {
    return this.element.value;
  }

  getCurrentText() {
    return this.getContent();
  }

  getFormat() {
    return 'TEXT';
  }

  extractContentForCheck(): ContentExtractionResult {
    this.html = this.getContent();
    this.currentHtmlChecking = this.html;
    return {content: this.html};
  }

  registerCheckResult(_checkResult: CheckResult): void {
  }

  registerCheckCall(_checkInfo: Check) {
  }

  scrollAndSelect(matches: AlignedMatch<Match>[]) {
    const newBegin = matches[0].range[0];
    const matchLength = getCompleteFlagLength(matches);
    const el = this.element;

    if (el.clientHeight < el.scrollHeight) {
      // This funny trick causes scrolling inside of the textarea.
      const text = this.element.value;
      el.value = text.slice(0, newBegin);
      el.focus();
      el.scrollTop = 1e9; // Scroll to the end of the textarea.
      const cursorScrollTop = el.scrollTop;
      el.value = text;
      if (cursorScrollTop > 0) {
        el.scrollTop = cursorScrollTop + el.clientHeight / 2;
      }
    }

    el.setSelectionRange(newBegin, newBegin + matchLength);
    el.focus();
    scrollIntoView(el, this.config.scrollOffsetY);
  }

  selectRanges(checkId: string, matches: Match[]) {
    this.selectMatches(checkId, matches);
  }

  selectMatches<T extends Match>(_checkId: string, matches: T[]): AlignedMatch<T>[] {
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
    fakeInputEvent(this.element);
  }
}