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
/*global AcrSelectionUtils */

'use strict';
var InputAdapter = (function () {
  var cls = function (element) {
    if (element.editorId !== undefined) {
      this.element = document.getElementById(element.editorId);
    } else {
      this.element = element;
    }
  };

  cls.prototype = {
    getHTML: function () {
      return $(this.element).val();
    },

    getEditorDocument: function () {
      try {
        return this.element.ownerDocument;
      } catch (error) {
        throw error;
      }
    },

    getCurrentText: function () {
      try {
          return this.getHTML();
      } catch (error) {
        throw error;
      }
    },

    extractHTMLForCheck: function () {
      this.html = this.getHTML();
      this.currentHtmlChecking = this.html;
      return {html: this.html};
    },

    registerCheckResult: function (checkResult) {
      return [];
    },
    registerCheckCall : function (checkInfo) {

    },


    selectText: function (begin, length) {
      var doc = this.getEditorDocument();
      var selection = rangy.getSelection(doc);
      var range = rangy.createRange(doc);

      range.setStart(this.element,0);
      range.moveStart('character', begin);
      range.moveEnd('character', length);
      selection.setSingleRange(range);
      return range;
    },

    scrollIntoView2: function (sel) {
      var range = sel.getRangeAt(0);
      var tmp = range.cloneRange();
      tmp.collapse();

      var text = document.createElement('span');
      tmp.startContainer.parentNode.insertBefore(text, tmp.startContainer);
      text.scrollIntoView();
      text.remove();


    },

    scrollAndSelect: function (matches) {
      var newBegin,
        matchLength,
        selection1,
        selection2,
        range1,
        range2,
        doc;

      newBegin = matches[0].foundOffset;
      matchLength = matches[0].flagLength + 1;

      $(this.element).focus();
      $(this.element).setSelection(newBegin,newBegin + matchLength);

      $(this.element)[0].scrollIntoView();
      var wpContainer = $('#wp-content-editor-container');
      if (wpContainer.length > 0) {
        window.scrollBy(0,-50);

      }

    },

    selectRanges: function (checkId, matches) {
      this.selectMatches(checkId, matches);
    },

    selectMatches: function (checkId, matches) {
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
    },

    replaceSelection: function (content) {
      //$(this.element).focus();
      $(this.element).replaceSelectedText(content,"select");

    },

    replaceRanges: function (checkId, matchesWithReplacement) {
      var replacementText,
        selectionFromCharPos = 0;
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
      replacementText = _.map(matchesWithReplacement, 'replacement').join('');
      this.replaceSelection(replacementText);

    }


  };

  return cls;
})();