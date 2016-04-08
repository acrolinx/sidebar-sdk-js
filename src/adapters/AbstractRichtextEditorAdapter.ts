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

namespace acrolinx.plugins.adapter {
  'use strict';

  import lookupMatchesStandard = acrolinx.plugins.lookup.diffbased.lookupMatches;
  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;

  import TextMapping = acrolinx.plugins.utils.TextDomMapping;
  import DomPosition = acrolinx.plugins.utils.DomPosition;
  import TextDomMapping = acrolinx.plugins.utils.TextDomMapping;

  import _ = acrolinxLibs._;

  export abstract class AbstractRichtextEditorAdapter implements AdapterInterface {
    editorId: string;
    editor: any;
    html: string;
    currentHtmlChecking: string;
    isCheckingNow: boolean;
    prevCheckedHtml: string;
    lookupMatches = lookupMatchesStandard;

    constructor(conf: AdapterConf) {
      this.editorId = conf.editorId;
      this.editor = null;
      if (conf.lookupMatches) {
        this.lookupMatches = conf.lookupMatches;
      }
    }

    abstract getEditorDocument(): Document;

    abstract getHTML();

    protected getEditorElement(): Element {
      return this.getEditorDocument().querySelector('body');
    }

    registerCheckCall(checkInfo) {
    }

    registerCheckResult(checkResult) {
      this.isCheckingNow = false;
      this.currentHtmlChecking = this.html;
      this.prevCheckedHtml = this.currentHtmlChecking;
      return [];
    }

    extractHTMLForCheck() {
      this.html = this.getHTML();
      this.currentHtmlChecking = this.html;
      return {html: this.html};
    }


    private scrollIntoView(sel: Selection) {
      const range = sel.getRangeAt(0);
      const tmp = range.cloneRange();
      tmp.collapse(false);

      const text = document.createElement('span');
      tmp.startContainer.parentNode.insertBefore(text, tmp.startContainer);
      text.scrollIntoView();
      text.remove();
    }

    private scrollToCurrentSelection() {
      const selection1 = this.getEditorDocument().getSelection();

      if (selection1) {
        try {
          this.scrollIntoView(selection1);
        } catch (error) {
          console.log("Scrolling Error: ", error);
        }
      }
    }

    selectRanges(checkId: string, matches: MatchWithReplacement[]) {
      this.selectMatches(checkId, matches);
      this.scrollToCurrentSelection();
    }


    private selectMatches(checkId: string, matches: MatchWithReplacement[]): [AlignedMatch[], TextMapping] {
      const textMapping: TextMapping = this.getTextDomMapping();
      const alignedMatches = this.lookupMatches(this.currentHtmlChecking, textMapping.text, matches);

      if (_.isEmpty(alignedMatches)) {
        throw new Error('Selected flagged content is modified.');
      }

      this.selectAlignedMatches(alignedMatches, textMapping);
      return [alignedMatches, textMapping];
    }

    private selectAlignedMatches(matches: AlignedMatch[], textMapping: TextMapping) {
      const newBegin = matches[0].foundOffset;
      const matchLength = matches[0].flagLength;
      this.selectText(newBegin, matchLength, textMapping);
    }

    private selectText(begin: number, length: number, textMapping: TextMapping) {
      const doc = this.getEditorDocument();
      const selection = doc.getSelection();
      const range = doc.createRange();

      const beginDomPosition = textMapping.domPositions[begin];
      const endDomPosition = utils.getEndDomPos(begin + length, textMapping.domPositions);
      range.setStart(beginDomPosition.node, beginDomPosition.offset);
      range.setEnd(endDomPosition.node, endDomPosition.offset);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    private replaceSelection(content: string) {
      const doc = this.getEditorDocument();
      const selection = doc.getSelection();
      const rng = selection.getRangeAt(0);
      rng.deleteContents();
      rng.insertNode(doc.createTextNode(content));
    }

    replaceRanges(checkId, matchesWithReplacement: MatchWithReplacement[]) {
      const [alignedMatches] = this.selectMatches(checkId, matchesWithReplacement);
      var replacement = _.map(alignedMatches, 'replacement').join('');
      this.replaceSelection(replacement);

      // Replacement will remove the selection, so we need to restore it again.
      this.selectText(alignedMatches[0].foundOffset, replacement.length, this.getTextDomMapping());
      this.scrollToCurrentSelection();
    }

    private getTextDomMapping() {
      return utils.extractTextDomMapping(this.getEditorElement());
    }

  }
}
