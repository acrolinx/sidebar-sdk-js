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

import {AdapterInterface} from "../../../src";
import {Check, DocumentSelection, Match, MatchWithReplacement} from "@acrolinx/sidebar-interface";
import {
  ContentExtractionResult,
  ExtractContentForCheckOpts,
  SuccessfulCheckResult
} from "../../../src/adapters/AdapterInterface";
import {lookupMatches} from "../../../src/lookup/diff-based";
import {AlignedMatch} from "../../../src/utils/alignment";
import {getCompleteFlagLength} from "../../../src/utils/match";
import _ = require("lodash");

export class FakeAdapter implements AdapterInterface {
  selection?: DocumentSelection;
  private currentContentChecking?: string;
  private lastContentChecked?: string;

  constructor(public content: string) {
  }

  getFormat() {
    return 'TEXT';
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): ContentExtractionResult {
    this.currentContentChecking = this.content;
    return {
      content: this.currentContentChecking,
      selection: opts.checkSelection ? this.selection : undefined
    };
  }

  registerCheckResult(_checkResult: SuccessfulCheckResult): void {
    this.lastContentChecked = this.currentContentChecking;
  }

  registerCheckCall(_checkInfo: Check) {
  }

  scrollAndSelect(matches: AlignedMatch<Match>[]) {
    const newBegin = matches[0].range[0];
    const matchLength = getCompleteFlagLength(matches);
    this.selection = {ranges: [[newBegin, newBegin + matchLength]]};
  }

  selectRanges(checkId: string, matches: Match[]) {
    this.selectMatches(checkId, matches);
  }

  selectMatches<T extends Match>(_checkId: string, matches: T[]): AlignedMatch<T>[] {
    const alignedMatches = lookupMatches(this.lastContentChecked!, this.content, matches, 'TEXT');

    if (_.isEmpty(alignedMatches)) {
      throw Error('Selected flagged content is modified.');
    }

    this.scrollAndSelect(alignedMatches);
    return alignedMatches;
  }

  replaceAlignedMatches(matches: AlignedMatch<MatchWithReplacement>[]) {
    const reversedMatches = _.clone(matches).reverse();
    let text = this.content;
    for (const match of reversedMatches) {
      text = text.slice(0, match.range[0]) + match.originalMatch.replacement + text.slice(match.range[1]);
    }
    this.content = text;
  }

  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    const alignedMatches = this.selectMatches(checkId, matchesWithReplacement);
    this.scrollAndSelect(alignedMatches);
    this.replaceAlignedMatches(alignedMatches);
    const startOfSelection = alignedMatches[0].range[0];
    const replacement = alignedMatches.map(m => m.originalMatch.replacement).join('');
    this.selection = {ranges: [[startOfSelection, startOfSelection + replacement.length]]};
  }
}
