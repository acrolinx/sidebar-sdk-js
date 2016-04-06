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
/// <reference path="AbstractRichtextEditorAdapter.ts" />

namespace acrolinx.plugins.adapter {
  'use strict';

  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;
  import lookupMatchesStandard = acrolinx.plugins.lookup.diffbased.lookupMatches;
  import _ = acrolinxLibs._;


  export class CKEditorAdapter extends AbstractRichtextEditorAdapter {
    getEditor() {
      if (this.editor === null) {
        if (CKEDITOR.instances.hasOwnProperty(this.editorId)) {
          this.editor = CKEDITOR.instances[this.editorId];
        }
      }
      return this.editor;
    }

    getEditorDocument() {
      return this.getEditor().document.$;
    }

    getHTML() {
      return this.getEditor().getData();
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
      matchLength = matches[0].flagLength;
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

    selectRanges(checkId, matches) {
      if (this.editor.mode === 'wysiwyg') {
        this.selectMatches(checkId, matches);
      } else {
        window.alert('Action is not permitted in Source mode.');
      }
    }

    replaceRanges(checkId, matchesWithReplacementArg: MatchWithReplacement[]) {
      if (this.editor.mode === 'wysiwyg') {
        super.replaceRanges(checkId, matchesWithReplacementArg);
      } else {
        window.alert('Action is not permitted in Source mode.');
      }
    }
  }
}