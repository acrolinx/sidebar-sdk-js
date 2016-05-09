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

/// <reference path="../lookup/diff-based.ts" />
/// <reference path="../utils/utils.ts" />

namespace acrolinx.plugins.adapter {
  'use strict';

  import lookupMatches = acrolinx.plugins.lookup.diffbased.lookupMatches;
  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import Match = acrolinx.sidebar.Match;
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;

  import TextMapping = acrolinx.plugins.utils.TextDomMapping;

  import _ = acrolinxLibs._;
  import CheckResult = acrolinx.sidebar.CheckResult;
  import Check = acrolinx.sidebar.Check;
  import getCompleteFlagLength = acrolinx.plugins.utils.getCompleteFlagLength;
  import fakeInputEvent = acrolinx.plugins.utils.fakeInputEvent;

  export abstract class AbstractRichtextEditorAdapter implements AdapterInterface {
    html: string;
    currentHtmlChecking: string;
    isCheckingNow: boolean;
    prevCheckedHtml: string;

    abstract getEditorDocument(): Document;

    abstract getHTML(): string;

    protected getEditorElement(): Element {
      return this.getEditorDocument().querySelector('body');
    }

    registerCheckCall(checkInfo: Check) {
    }

    registerCheckResult(checkResult: CheckResult): void {
      this.isCheckingNow = false;
      this.currentHtmlChecking = this.html;
      this.prevCheckedHtml = this.currentHtmlChecking;
    }

    extractHTMLForCheck() {
      this.html = this.getHTML();
      this.currentHtmlChecking = this.html;
      return {html: this.html} as HtmlResult;
    }


    private scrollIntoView(sel: Selection) {
      const range = sel.getRangeAt(0);
      const tmp = range.cloneRange();
      tmp.collapse(false);

      const text = document.createElement('span');
      tmp.insertNode(text);
      text.scrollIntoView();
      text.remove();
    }

    scrollToCurrentSelection() {
      const selection1 = this.getEditorDocument().getSelection();

      if (selection1) {
        try {
          this.scrollIntoView(selection1);
        } catch (error) {
          console.log('Scrolling Error: ', error);
        }
      }
    }

    selectRanges(checkId: string, matches: Match[]) {
      this.selectMatches(checkId, matches);
      this.scrollToCurrentSelection();
    }


    private selectMatches<T extends Match>(checkId: string, matches: T[]): [AlignedMatch<T>[], TextMapping] {
      const textMapping: TextMapping = this.getTextDomMapping();
      const alignedMatches: AlignedMatch<T>[] = lookupMatches(this.currentHtmlChecking, textMapping.text, matches);

      if (_.isEmpty(alignedMatches)) {
        throw new Error('Selected flagged content is modified.');
      }

      this.selectAlignedMatches(alignedMatches, textMapping);
      return [alignedMatches, textMapping];
    }

    private selectAlignedMatches(matches: AlignedMatch<Match>[], textMapping: TextMapping) {
      const newBegin = matches[0].range[0];
      const matchLength = getCompleteFlagLength(matches);
      this.selectText(newBegin, matchLength, textMapping);
    }

    private selectText(begin: number, length: number, textMapping: TextMapping) {
      if (!textMapping.text) {
        return;
      }
      const doc = this.getEditorDocument();
      const selection = doc.getSelection();
      selection.removeAllRanges();
      selection.addRange(this.createRange(begin, length, textMapping));
    }

    private createRange(begin: number, length: number, textMapping: TextMapping) {
      const doc = this.getEditorDocument();
      const range = doc.createRange();
      const beginDomPosition = textMapping.domPositions[begin];
      const endDomPosition = utils.getEndDomPos(begin + length, textMapping.domPositions);
      range.setStart(beginDomPosition.node, beginDomPosition.offset);
      range.setEnd(endDomPosition.node, endDomPosition.offset);
      return range;
    }

    private replaceAlignedMatches(matches: AlignedMatch<MatchWithReplacement>[]) {
      const doc = this.getEditorDocument();
      const reversedMatches = _.clone(matches).reverse();
      for (let match of reversedMatches) {
        const textDomMapping = this.getTextDomMapping();
        const rangeLength = match.range[1] - match.range[0];
        if (rangeLength > 1) {
          const tail = this.createRange(match.range[0] + 1, rangeLength - 1, textDomMapping);
          const head = this.createRange(match.range[0], 1, textDomMapping);
          tail.deleteContents();
          head.deleteContents();
          head.insertNode(doc.createTextNode(match.originalMatch.replacement));
        } else {
          const range = this.createRange(match.range[0], rangeLength, textDomMapping);
          range.deleteContents();
          range.insertNode(doc.createTextNode(match.originalMatch.replacement));
        }
      }
    }

    replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
      const [alignedMatches] = this.selectMatches(checkId, matchesWithReplacement);
      const replacement = alignedMatches.map(m => m.originalMatch.replacement).join('');
      this.replaceAlignedMatches(alignedMatches);

      // Replacement will remove the selection, so we need to restore it again.
      this.selectText(alignedMatches[0].range[0], replacement.length, this.getTextDomMapping());
      this.scrollToCurrentSelection();
      fakeInputEvent(this.getEditorElement());
    }

    private getTextDomMapping() {
      return utils.extractTextDomMapping(this.getEditorElement());
    }

  }
}
