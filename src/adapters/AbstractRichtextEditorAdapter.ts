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

/// <reference path="../typings/rangy.d.ts" />
/// <reference path="../lookup/diff-based.ts" />

namespace acrolinx.plugins.adapter {
  'use strict';

  import lookupMatchesStandard = acrolinx.plugins.lookup.diffbased.lookupMatches;
  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;
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

    abstract getEditorDocument();

    abstract scrollAndSelect(matches);

    abstract getHTML();

    abstract extractHTMLForCheck();

    abstract selectRanges(checkId, matches);

    registerCheckCall(checkInfo) {
    }

    registerCheckResult(checkResult) {
      this.isCheckingNow = false;
      this.currentHtmlChecking = this.html;
      this.prevCheckedHtml = this.currentHtmlChecking;
      return [];
    }


    getCurrentText() {
      return rangy.innerText(this.getEditorDocument());
    }

    selectMatches(checkId, matches: MatchWithReplacement[]): AlignedMatch[] {
      const alignedMatches = this.lookupMatches(this.currentHtmlChecking, this.getCurrentText(), matches);

      if (_.isEmpty(alignedMatches)) {
        throw 'Selected flagged content is modified.';
      }

      this.scrollAndSelect(alignedMatches);

      return alignedMatches;
    }

    selectText(begin, length) {
      var doc = this.getEditorDocument();
      var selection = rangy.getSelection(doc);
      var range = rangy.createRange(doc);

      range.moveStart('character', begin);
      range.moveEnd('character', length);
      selection.setSingleRange(range);
      return range;
    }

    replaceRangeContent(range, replacementText: string) {
      range.deleteContents();
      if (replacementText) {
        range.insertNode(this.getEditorDocument().createTextNode(replacementText));
      }
    }

    replaceRanges(checkId, matchesWithReplacement: MatchWithReplacement[]) {
      const selectionFromCharPos = 1;

      try {
        // this is the selection on which replacement happens
        const alignedMatches = this.selectMatches(checkId, matchesWithReplacement);

        /*
         * CKEDITOR/TinyMCE & RANGY DEFECT: Replacement of first word of document or table cell
         * (after selection) throws an error
         * WorkAround:
         * 1. Select from the second character of the word
         * 2. Replace the selection
         * 3. Delete the first character
         **/
        const useWorkAround = alignedMatches[0].foundOffset + alignedMatches[0].flagLength - 1 < this.getCurrentText().length;

        if (useWorkAround) {
          alignedMatches[0].foundOffset += selectionFromCharPos;
          alignedMatches[0].flagLength -= selectionFromCharPos;
        }

        // Select the replacement, as replacement of selected flag will be done
        const selectedRange = this.scrollAndSelect(alignedMatches);

        // Replace the selected text
        const replacementText = _.map(alignedMatches, 'replacement').join('');
        this.replaceRangeContent(selectedRange, replacementText);

        if (useWorkAround) {
          if (selectionFromCharPos > 0) {
            // Select & delete characters which were not replaced above
            this.selectText(alignedMatches[0].foundOffset - selectionFromCharPos, selectionFromCharPos);
            rangy.getSelection(this.getEditorDocument()).nativeSelection.deleteFromDocument();
          }
          alignedMatches[0].foundOffset -= selectionFromCharPos;
          alignedMatches[0].flagLength += selectionFromCharPos;
        }

        // Select the replaced flag
        this.selectText(alignedMatches[0].foundOffset, replacementText.length);

      } catch (error) {
        console.log(error);
        throw error;
      }
    }
  }
}
