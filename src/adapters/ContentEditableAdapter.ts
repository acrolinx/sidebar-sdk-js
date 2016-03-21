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

  import AdapterInterface = acrolinx.plugins.adapter.AdapterInterface;
  import AcrSelectionUtils = acrolinx.plugins.utils.selection;
  import $ = acrolinxLibs.$;
  import _ = acrolinxLibs._;

  'use strict';

  export class ContentEditableAdapter implements AdapterInterface {
    element:any;
    html:any;
    currentHtmlChecking:any;

    constructor(conf) {
      this.element = document.getElementById(conf.editorId);
    }

    registerCheckCall(checkInfo){

    }

    registerCheckResult(checkResult) {
      return [];
    }

    getHTML() {
      return this.element.innerHTML;
    }

    getEditorDocument() {
      try {
        return this.element.ownerDocument;
      } catch (error) {
        throw error;
      }
    }

    getCurrentText() {
      try {
        return rangy.innerText(this.element);
      } catch (error) {
        throw error;
      }
    }

    extractHTMLForCheck() {
      this.html = this.getHTML();
      this.currentHtmlChecking = this.html;
      return {html: this.html};
    }

    selectText(begin, length) {
      var doc = this.getEditorDocument();
      var selection = rangy.getSelection(doc);
      var range = rangy.createRange(doc);

      range.setStart(this.element, 0);
      range.moveStart('character', begin);
      range.moveEnd('character', length);
      selection.setSingleRange(range);
      return range;
    }

    scrollIntoView2(sel) {
      var range = sel.getRangeAt(0);
      var tmp = range.cloneRange();
      tmp.collapse();

      var text = document.createElement('span');
      tmp.startContainer.parentNode.insertBefore(text, tmp.startContainer);
      text.scrollIntoView();
      text.remove();


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
      //$(getEditor().getBody()).find('em').get(0).scrollIntoView();
      //selection1 = this.getEditor().selection;
      selection1 = rangy.getSelection(this.getEditorDocument());

      if (selection1) {
        try {
          //selection1.scrollIntoView();
          this.scrollIntoView2(selection1);
          //Special hack for WordPress TinyMCE
          var wpContainer = $('#wp-content-editor-container');
          if (wpContainer.length > 0) {
            window.scrollBy(0, -50);

          }
          //var wpContainer = $('#wp-content-editor-container');
          //if (wpContainer.length > 0) {
          //  wpContainer.get(0).scrollIntoView();
          //}
        } catch (error) {
          console.log("Scrolling Error!");
        }
      }
      //
      // scrollIntoView need to set it again
      range2 = this.selectText(newBegin, matchLength);
    }

    selectRanges(checkId, matches) {
      this.selectMatches(checkId, matches);
    }

    selectMatches(checkId, matches) {
      var rangyFlagOffsets,
        index,
        offset;

      var rangyText = this.getCurrentText();

      matches = AcrSelectionUtils.addPropertiesToMatches(matches, this.currentHtmlChecking);

      rangyFlagOffsets = AcrSelectionUtils.findAllFlagOffsets(rangyText, matches[0].searchPattern);
      index = AcrSelectionUtils.findBestMatchOffset(rangyFlagOffsets, matches);

      offset = rangyFlagOffsets[index];
      matches[0].foundOffset = offset;

      //Remove escaped backslash in the text content. Escaped backslash can only present
      //for multiple punctuation cases. For long sentence, backslashes may present which
      //must not be removed as they are part of the original text
      if (matches[0].content.length >= matches[0].range[1] - matches[0].range[0]) {
        matches[0].textContent = matches[0].textContent.replace(/\\/g, '');
      } else {
        matches[0].textContent = matches[0].textContent.replace(/\\\\/g, '\\');
      }
      matches[0].flagLength = matches[0].textContent.length - 1;

      if (offset >= 0) {
        this.scrollAndSelect(matches);
      } else {
        throw 'Selected flagged content is modified.';
      }
    }

    replaceSelection(content) {
      var doc = this.getEditorDocument();
      var selection = rangy.getSelection(doc);
      var rng = selection.getRangeAt(0);
      content += '<span id="__caret">_</span>';
      rng.deleteContents();
      var frag = rng.createContextualFragment(content);
      rng.insertNode(frag);

      var caretNode = doc.getElementById('__caret');

      // Make sure we wrap it compleatly, Opera fails with a simple select call
      rng = rangy.createRange();
      rng.setStartBefore(caretNode);
      rng.setEndBefore(caretNode);
      rangy.getSelection().setSingleRange(rng as RangyRange);


      caretNode.parentNode.removeChild(caretNode);
    }

    replaceRanges(checkId, matchesWithReplacement) {
      var replacementText,
        selectionFromCharPos = 1;

      try {
        // this is the selection on which replacement happens
        this.selectMatches(checkId, matchesWithReplacement);

        if (matchesWithReplacement[0].foundOffset + matchesWithReplacement[0].flagLength < this.getCurrentText().length) {
          matchesWithReplacement[0].foundOffset += selectionFromCharPos;
          matchesWithReplacement[0].flagLength -= selectionFromCharPos;
        }

        // Select the replacement, as replacement of selected flag will be done
        this.scrollAndSelect(matchesWithReplacement);
      } catch (error) {
        console.log(error);
        return;
      }

      // Replace the selected text
      replacementText = _.map(matchesWithReplacement, 'replacement').join('');
      //this.editor.selection.setContent(replacementText);
      this.replaceSelection(replacementText);

      if ((matchesWithReplacement[0].foundOffset + matchesWithReplacement[0].flagLength) < this.getCurrentText().length) {
        if (selectionFromCharPos > 0) {
          // Select & delete characters which were not replaced above
          this.selectText(matchesWithReplacement[0].foundOffset - selectionFromCharPos, selectionFromCharPos);
          rangy.getSelection(this.getEditorDocument()).nativeSelection.deleteFromDocument();
        }
        matchesWithReplacement[0].foundOffset -= selectionFromCharPos;
        matchesWithReplacement[0].flagLength += selectionFromCharPos;
      }

      // Select the replaced flag
      this.selectText(matchesWithReplacement[0].foundOffset, replacementText.length);
    }
  }
}

