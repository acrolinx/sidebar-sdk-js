/*
 * Copyright 2015-present Acrolinx GmbH
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

import { Check, DocumentSelection, Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import * as _ from 'lodash';
import {
  AdapterConf,
  AdapterInterface,
  AutobindWrapperAttributes,
  ContentExtractionResult,
  ExtractContentForCheckOpts,
  getElementFromAdapterConf,
  SuccessfulCheckResult,
} from './AdapterInterface';
import { AlignedMatch } from '../utils/alignment';
import { getCompleteFlagLength, isDangerousToReplace } from '../utils/match';
import { scrollIntoView } from '../utils/scrolling';
import { lookupMatches } from '../lookup/diff-based';
import { assertElementIsDisplayed, simulateInputEvent } from '../utils/utils';
import { getAutobindWrapperAttributes } from '../utils/adapter-utils';

export type ValidInputElement = HTMLInputElement | HTMLTextAreaElement;

export type Format = 'TEXT' | 'MARKDOWN';

export type InputAdapterConf = AdapterConf & {
  format?: Format;
};

export class InputAdapter implements AdapterInterface {
  readonly element: ValidInputElement;
  config: InputAdapterConf;
  private currentContentChecking?: string;
  private lastContentChecked?: string;

  constructor(conf: InputAdapterConf) {
    this.element = getElementFromAdapterConf(conf) as ValidInputElement;
    this.config = _.cloneDeep(conf);
  }

  getContent() {
    return this.element.value;
  }

  getCurrentText() {
    return this.getContent();
  }

  getFormat() {
    return this.config.format || 'TEXT';
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): ContentExtractionResult {
    this.currentContentChecking = this.getContent();
    return {
      content: this.currentContentChecking,
      selection: opts.checkSelection ? this.getSelection() : undefined,
    };
  }

  private getSelection(): DocumentSelection | undefined {
    const selectionStart = this.element.selectionStart;
    const selectionEnd = this.element.selectionEnd;
    if (
      _.isNumber(selectionStart) &&
      _.isNumber(selectionEnd) &&
      selectionStart < selectionEnd &&
      this.getContent().slice(selectionStart, selectionEnd).trim() !== ''
    ) {
      return {
        ranges: [[selectionStart, selectionEnd]],
      };
    } else {
      return undefined;
    }
  }

  registerCheckResult(_checkResult: SuccessfulCheckResult): void {
    this.lastContentChecked = this.currentContentChecking;
  }

  registerCheckCall(_checkInfo: Check) {}

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

    (el as HTMLTextAreaElement).setSelectionRange(newBegin, newBegin + matchLength);
    el.focus();
    scrollIntoView(el, this.config.scrollOffsetY);
  }

  selectRanges(checkId: string, matches: Match[]) {
    this.selectMatches(checkId, matches);
  }

  selectMatches<T extends Match>(_checkId: string, matches: T[]): AlignedMatch<T>[] {
    assertElementIsDisplayed(this.element);
    const alignedMatches = lookupMatches(this.lastContentChecked!, this.getCurrentText(), matches, 'TEXT');

    if (_.isEmpty(alignedMatches)) {
      throw Error('Selected flagged content is modified.');
    }

    this.scrollAndSelect(alignedMatches);
    return alignedMatches;
  }

  replaceAlignedMatches(matches: AlignedMatch<MatchWithReplacement>[]) {
    const reversedMatches = _.clone(matches).reverse();
    const el = this.element;
    let text = el.value;
    for (const match of reversedMatches) {
      if (!isDangerousToReplace(this.lastContentChecked!, match.originalMatch)) {
        text = text.slice(0, match.range[0]) + match.originalMatch.replacement + text.slice(match.range[1]);
      }
    }
    el.value = text;
  }

  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    const alignedMatches = this.selectMatches(checkId, matchesWithReplacement);
    this.scrollAndSelect(alignedMatches);
    this.replaceAlignedMatches(alignedMatches);
    const startOfSelection = alignedMatches[0].range[0];
    const replacement = alignedMatches.map((m) => m.originalMatch.replacement).join('');
    (this.element as HTMLTextAreaElement).setSelectionRange(startOfSelection, startOfSelection + replacement.length);
    simulateInputEvent(this.element);
  }

  getAutobindWrapperAttributes(): AutobindWrapperAttributes {
    return getAutobindWrapperAttributes(this.element);
  }
}
