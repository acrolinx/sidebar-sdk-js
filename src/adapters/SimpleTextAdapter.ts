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

  export class SimpleTextAdapter implements AdapterInterface {
    config:any;

    constructor(conf) {
      this.config = conf;
    }

    selectText(begin, length) {
      /*
       * The DOM does not allow you to select text with offsets easily, but Rangy provides an implementation for that.
       * If you run into performance problems you should use another implementation.
       */
      var editorElement = this.getEditorElement();
      var r = rangy.createRange();
      r.setStart(editorElement, 0);
      r.setEnd(editorElement, 0);
      r.moveStart('character', begin);
      r.moveEnd('character', length);
      var sel = rangy.getSelection();
      sel.setSingleRange(r);
    }


    findRangesPositionInPlainText(text, matches) {
      /*
       Be aware that matches can be discontinuous. Check if(matches[i].range[1] == matches[i+1].range[0]).
       An implementation for production use should store the last checked document content in a variable and look up the range offsets in the original document.
       Afterwards, it should map these offsets to the actual offsets of document. Due to changes in the document, the offsets might differ.
       */
      var rangesText = matches.map(function (match) {
        return match.content;
      }).join('');
      var indexOfRangesText = text.indexOf(rangesText);
      if (indexOfRangesText > -1) {
        return {
          start: indexOfRangesText,
          length: rangesText.length
        };
      } else {
        return null;
      }
    }

    getEditor() {
      return document.getElementById(this.config.editorId);
    }

    getEditorElement() {
      return this.getEditor();
    }

    getCurrentText() {
      return rangy.innerText(this.getEditorElement());
    }

    getHTML() {
      return this.getEditor().innerHTML;
    }

    extractHTMLForCheck() {
      return {html: this.getHTML()};
    }


    registerCheckCall(checkInfo) {

    }


    registerCheckResult(checkResult) {
      return [];
    }


    selectRanges(checkId, matches) {
      var positionInPlainText = this.findRangesPositionInPlainText(this.getCurrentText(), matches);
      if (positionInPlainText) {
        this.selectText(positionInPlainText.start, positionInPlainText.length);
        // In a complete plugin we should also scroll to the selected text.
      } else {
        window.alert('Sorry, but I can\'t select this issue.');
      }

    }

    replaceRanges(checkId, matchesWithReplacement) {
      this.selectRanges(checkId, matchesWithReplacement);
      var replacementText = matchesWithReplacement.map(function (matcheWithReplacement) {
        return matcheWithReplacement.replacement;
      }).join('');
      var sel = rangy.getSelection();
      var range = sel.getRangeAt(0);
      range.deleteContents();
      var node = range.createContextualFragment(replacementText);
      range.insertNode(node);

    }

  }

}
;