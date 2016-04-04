/// <reference path="../typings/rangy.d.ts" />
/// <reference path="../lookup/standard.ts" />

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
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;
  import lookupMatchesStandard = acrolinx.plugins.lookup.standard.lookupMatches;
  import _ = acrolinxLibs._;

  function replaceRangeContent(range, replacementText) {
    range.deleteContents();
    if (replacementText) {
      range.insertNode(range.createContextualFragment(replacementText));
    }
  }

  export class CKEditorAdapter implements AdapterInterface {
    editorId: any;
    editor: any;
    html: any;
    currentHtmlChecking: any;
    checkStartTime: any;
    isCheckingNow: any;
    prevCheckedHtml: any;
    lookupMatches = lookupMatchesStandard;


    constructor(conf: AdapterConf) {
      this.editorId = conf.editorId;
      this.editor = null;
      if (conf.lookupMatches) {
        this.lookupMatches = conf.lookupMatches;
      }
    }

    getEditor() {
      if (this.editor === null) {
        if (CKEDITOR.instances.hasOwnProperty(this.editorId)) {
          this.editor = CKEDITOR.instances[this.editorId];
        }
      }
      return this.editor;
    }

    getEditorDocument() {
      try {
        return this.getEditor().document.$;
      } catch (error) {
        throw error;
      }
    }

    getCurrentText() {
      try {
        return rangy.innerText(this.getEditorDocument());
      } catch (error) {
        throw error;
      }
    }

    getHTML() {
      return this.getEditor().getData();
    }

    createRange(begin, length) {
      var editorDocument = this.getEditorDocument();
      var range = rangy.createRange(editorDocument);
      range.setStart(editorDocument, 0);
      range.setEnd(editorDocument, 0);
      range.moveStart('character', begin);
      range.moveEnd('character', length);
      return range;
    }

    selectText(begin, length) {
      var range = this.createRange(begin, length);
      var selection = rangy.getSelection(this.getEditorDocument());
      selection.setSingleRange(range);
      return range;
    }

    scrollAndSelect(matches) {
      var newBegin,
        matchLength,
        selection1,
        selection2,
        range1,
        range2,
        doc;
      newBegin = matches[0].foundOffset;
      matchLength = matches[0].flagLength + 1;
      range1 = this.selectText(newBegin, matchLength);
      selection1 = this.getEditor().getSelection();
      if (selection1) {
        try {
          selection1.scrollIntoView();
        } catch (error) {

        }
      }

      // scrollIntoView need to set it again
      doc = this.getEditorDocument();
      selection2 = rangy.getSelection(doc);
      range2 = rangy.createRange(doc);
      range2.setStart(range1.startContainer, range1.startOffset);
      range2.setEnd(range1.endContainer, range1.endOffset);
      selection2.setSingleRange(range2);
      return range2;
    }

    extractHTMLForCheck(): any {
      this.html = this.getHTML();
      this.currentHtmlChecking = this.html;
      if (this.editor.mode === 'wysiwyg') {
        this.checkStartTime = Date.now();
        //TODO: remove it after server side implementation. This is a workaround
        if (this.html === '') {
          this.html = '<span> </span>';
        }
      } else {
        if (this.isCheckingNow) {
          this.isCheckingNow = false;
        } else {
          return {error: "Action is not permitted in Source mode."};
        }
      }
      return {html: this.html};
    }

    registerCheckCall(checkInfo) {

    }

    registerCheckResult(checkResult) {
      this.isCheckingNow = false;
      this.currentHtmlChecking = this.html;
      this.prevCheckedHtml = this.currentHtmlChecking;
      return [];
    }

    selectRanges(checkId, matches) {
      if (this.editor.mode === 'wysiwyg') {

        this.selectMatches(checkId, matches);

      } else {
        window.alert('Action is not permitted in Source mode.');
      }
    }

    selectMatches(checkId, matches: MatchWithReplacement[]): AlignedMatch[] {
      const alignedMatches = this.lookupMatches(this.currentHtmlChecking, this.getCurrentText(), matches);

      if (_.isEmpty(alignedMatches)) {
        throw 'Selected flagged content is modified.';
      }

      this.scrollAndSelect(alignedMatches);

      return alignedMatches;
    }

    replaceRanges(checkId, matchesWithReplacementArg: MatchWithReplacement[]) {
      const selectionFromCharPos = 1;

      if (this.editor.mode === 'wysiwyg') {
        try {
          // this is the selection on which replacement happens
          const alignedMatches = this.selectMatches(checkId, matchesWithReplacementArg);
          this.selectMatches(checkId, alignedMatches);

          /*
           CKEDITOR & RANGY DEFECT: Replacement of first word of document or table cell
           (after selection) throws an error
           SOLUTION:
           1. Select from the second character of the word
           2. Replace the selection
           3. Delete the first character
           */
          if (alignedMatches[0].foundOffset + alignedMatches[0].flagLength < this.getCurrentText().length) {
            alignedMatches[0].foundOffset += selectionFromCharPos;
            alignedMatches[0].flagLength -= selectionFromCharPos;
          }

          // Select the replacement, as replacement of selected flag will be done
          const selectedRange = this.scrollAndSelect(alignedMatches);


          // Replace the selected text
          const replacementText = _.map(alignedMatches, 'replacement').join('');
          // using editor.insertText(replacementText) caused bugs in inline mode
          replaceRangeContent(selectedRange, replacementText);

          if ((alignedMatches[0].foundOffset + alignedMatches[0].flagLength) < this.getCurrentText().length) {
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
          return;
        }

      } else {
        window.alert('Action is not permitted in Source mode.');
      }
    }
  }
}