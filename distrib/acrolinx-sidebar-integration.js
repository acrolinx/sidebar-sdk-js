'use strict';
// Source: src/adapters/AcrSelectionUtils.js
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

var AcrSelectionUtils = {
  isFlagContainsOnlySpecialChar: function (flaggedContent) {
    var pattern = /\w/g;
    return !pattern.test(flaggedContent);
  },

  replaceRangeContent: function (range, replacementText) {
    range.deleteContents();
    range.insertNode(range.createContextualFragment(replacementText));
  },
  getTextContent: function (html) {
    var tmpHTMLElement = $('<div/>').html(html);
    return tmpHTMLElement.text().replace(/\t+/g, '');
  },


  escapeRegExp: function (string) {
    return string.replace(/([\".*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  },

  /* Add word boundary only in following three cases
   * 1. The very next character of the match is also valid word character
   * 2. When the last character of the match is not hyphen (45)
   * 3. When atleast one character of flagged word is a 'word' character
   * (#3) is used to handle flags containing only punctuations
   */
  createSearchPattern: function (matches,currentHtmlChecking) {
    var searchPattern = matches[0].textContent,
      wordBoundary = '\\b';

    if (AcrSelectionUtils.shouldApplyWordBoundary(matches,currentHtmlChecking) === true) {
      searchPattern = wordBoundary + searchPattern + wordBoundary;
    }
    return searchPattern;
  },

  shouldApplyWordBoundary: function (matches,currentHtmlChecking) {
    var offset = matches[matches.length - 1].range[1],
      lastChar,
      nextChar,
      firstChar,
      flaggedWords,
      firstFlaggedWord,
      lastFlaggedWord;

    nextChar = AcrSelectionUtils.getFlagContents(offset, offset + 1,currentHtmlChecking);
    flaggedWords = matches[0].textContent.split(/\\s+/);
    firstFlaggedWord = flaggedWords[0];
    firstChar = firstFlaggedWord.substr(0, 1);
    lastFlaggedWord = firstFlaggedWord;

    if (flaggedWords.length > 1) {
      lastFlaggedWord = flaggedWords[1];
    }

    lastChar = lastFlaggedWord.substr(lastFlaggedWord.length - 1, 1);

    // Single flagged word and if word contains apostrophe within, then don't use word boundary
    // as the suggestion for "dan't" is coming as "da", which is part of word :/
    /*
     if(flaggedWords.length ==1){
     if(firstFlaggedWord.indexOf('\'') < firstFlaggedWord.length){
     return false;
     }
     }
     */

    if ((lastFlaggedWord.indexOf('&') > -1) && (lastFlaggedWord.indexOf(';') > -1) && (lastFlaggedWord.indexOf(';') > lastFlaggedWord.indexOf('&'))) {
      return false;
    }

    if ((firstFlaggedWord.indexOf('&') > -1) && (firstFlaggedWord.indexOf(';') > -1) && (firstFlaggedWord.indexOf(';') > firstFlaggedWord.indexOf('&'))) {
      return false;
    }

    if ((AcrSelectionUtils.isAlphaNumeral(firstChar) && AcrSelectionUtils.isAlphaNumeral(lastChar) && AcrSelectionUtils.isAlphaNumeral(nextChar)) &&
      lastChar.charCodeAt(0) !== 45 && !AcrSelectionUtils.isFlagContainsOnlySpecialChar(matches[0].htmlContent)) {
      return true;
    }
    return false;
  },

  isAlphaNumeral: function (character) {

    if ((character.charCodeAt(0) >= 48 && character.charCodeAt(0) <= 90 ) ||
      (character.charCodeAt(0) >= 97 && character.charCodeAt(0) <= 126)) {
      return true;
    }
    return false;
  },

  getFlagContents: function (begin, end,currentHtmlChecking) {
    return currentHtmlChecking.substr(begin, end - begin);
  },

  addPropertiesToMatches: function (matches,currentHtmlChecking) {
    var textContent,
      htmlContentBeforeFlag,
      textContentBeforeFlag,
      regexForHTMLTag,
      match,
      startOffset = matches[0].range[0],
      endOffset = matches[matches.length - 1].range[1];

    // Convert html offset to text offset
    htmlContentBeforeFlag = AcrSelectionUtils.getFlagContents(0, startOffset,currentHtmlChecking);
    textContentBeforeFlag = AcrSelectionUtils.getTextContent(htmlContentBeforeFlag);
    matches[0].textOffset = textContentBeforeFlag.length;
    if (matches[0].textOffset === 0) {
      //pattern to get html tags
      regexForHTMLTag = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*/gm;


      if ((match = regexForHTMLTag.exec(htmlContentBeforeFlag)) !== null) {
        startOffset = matches[0].textOffset + match.input.length;
      }


    }
    matches[0].htmlContent = AcrSelectionUtils.getFlagContents(startOffset, endOffset,currentHtmlChecking);

    // Convert Flag HTML into inner Text
    textContent = AcrSelectionUtils.getTextContent(matches[0].htmlContent);
    textContent = AcrSelectionUtils.escapeRegExp(textContent);
    matches[0].textContent = textContent;
    matches[0].searchPattern = AcrSelectionUtils.createSearchPattern(matches,currentHtmlChecking);
    return matches;
  },

  findBestMatchOffset: function (flagHtmlOffsets, matches) {
    var minOffsetIndex = -1,
      originalFlagOffset = matches[0].textOffset;

    if (flagHtmlOffsets.length > 0) {
      minOffsetIndex = 0;
      var minOffset = Math.abs(flagHtmlOffsets[minOffsetIndex] - originalFlagOffset);

      for (var i = 0; i < flagHtmlOffsets.length; i++) {
        if (Math.abs(flagHtmlOffsets[i] - originalFlagOffset) < minOffset) {
          minOffsetIndex = i;
          minOffset = Math.abs(flagHtmlOffsets[minOffsetIndex] - originalFlagOffset);
        }
      }
    }
    return minOffsetIndex;
  },



  findAllFlagOffsets: function (paragraph, stringToPattern) {
    var matchedWords,
      pattern,
      flagOffsets = [];

    pattern = new RegExp(stringToPattern, 'gm');
    var lastIndex = null;
    while ((matchedWords = pattern.exec(paragraph)) !== null) {
      var index = matchedWords.index;
      if (lastIndex === index) {
        break;
      }
      lastIndex = index;
      flagOffsets.push(index);
    }

    return flagOffsets;
  },


};
// Source: src/adapters/CKEditorAdapter.js
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
var CKEditorAdapter = (function () {

  var cls = function (conf) {
    this.config = conf;
    this.editorId = conf.editorId;
    this.editor = null;

  };



  cls.prototype = {


    getEditor: function () {
      if (this.editor === null) {
        if (CKEDITOR.instances.hasOwnProperty(this.editorId)) {
          this.editor = CKEDITOR.instances[this.editorId];
        }
      }
      return this.editor;
    },

    getEditorDocument: function () {
      try {
        return this.getEditor().document.$;
      } catch (error) {
        throw error;
      }
    },

    getEditableElement: function () {
      return this.editor.editable().$;
    },

    getCurrentText: function () {
      try {
        return rangy.innerText(this.getEditorDocument());
      } catch (error) {
        throw error;
      }
    },

    getHTML: function () {
      return this.getEditor().getData();
    },

    createRange: function (begin, length) {
      var editableElement = this.getEditableElement();
      var range = rangy.createRange(this.getEditorDocument());
      range.setStart(editableElement, 0);
      range.setEnd(editableElement, 0);
      range.moveStart('character', begin);
      range.moveEnd('character', length);
      return range;
    },

    selectText: function (begin, length) {
      var range = this.createRange(begin, length);
      var selection = rangy.getSelection(this.getEditorDocument());
      selection.setSingleRange(range);
      return range;
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
    },

    extractHTMLForCheck: function () {

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

    },

    registerCheckCall: function (checkInfo) {

    },


    registerCheckResult: function (checkResult) {
      this.isCheckingNow = false;
      this.currentHtmlChecking = this.html;
      this.prevCheckedHtml = this.currentHtmlChecking;
      return [];
    },

    selectRanges: function (checkId, matches) {
      if (this.editor.mode === 'wysiwyg') {

        this.selectMatches(checkId, matches);

      } else {
        window.alert('Action is not permitted in Source mode.');
      }
    },

    selectMatches: function (checkId, matches) {
      var rangyFlagOffsets,
        index,
        offset;

      var rangyText = this.getCurrentText();

      matches = AcrSelectionUtils.addPropertiesToMatches(matches,this.currentHtmlChecking);

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


    replaceRanges: function (checkId, matchesWithReplacement) {
      var replacementText,
        selectedRange,
        selectionFromCharPos = 1;

      if (this.editor.mode === 'wysiwyg') {
        try {
          // this is the selection on which replacement happens
          this.selectMatches(checkId, matchesWithReplacement);

          /*
           CKEDITOR & RANGY DEFECT: Replacement of first word of document or table cell
           (after selection) throws an error
           SOLUTION:
           1. Select from the second character of the word
           2. Replace the selection
           3. Delete the first character
           */
          if (matchesWithReplacement[0].foundOffset + matchesWithReplacement[0].flagLength < this.getCurrentText().length) {
            matchesWithReplacement[0].foundOffset += selectionFromCharPos;
            matchesWithReplacement[0].flagLength -= selectionFromCharPos;
          }

          // Select the replacement, as replacement of selected flag will be done
          selectedRange = this.scrollAndSelect(matchesWithReplacement);
        } catch (error) {
          console.log(error);
          return;
        }

        // Replace the selected text
        replacementText = _.map(matchesWithReplacement, 'replacement').join('');
        // using editor.insertText(replacementText) caused bugs in inline mode
        AcrSelectionUtils.replaceRangeContent(selectedRange, replacementText);

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

      } else {
        window.alert('Action is not permitted in Source mode.');
      }
    },


  };

  return cls;

})();
// Source: src/adapters/InputAdapter.js
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
// Source: src/adapters/MultiEditorAdapter.js
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
 /*global Q */
var MultiEditorAdapter = (function () {
  var cls = function (conf) {
    this.config = conf;
    this.adapters = [];

  };


  cls.prototype = {
    addSingleAdapter: function (singleAdapter, wrapper,id) {
      if (wrapper === undefined) {
        wrapper = 'div';
      }
      if (id === undefined) {
        id = 'acrolinx_integration' + this.adapters.length;
      }
      this.adapters.push({id: id, adapter: singleAdapter,wrapper:wrapper});
    },

    getWrapperTag: function (wrapper) {
      var tag = wrapper.split(" ")[0];
      return tag;
    },

    extractHTMLForCheck: function () {
      var deferred = Q.defer();
      var htmls = [];
      for (var i = 0; i < this.adapters.length; i++) {
        var el = this.adapters[i];
        htmls.push(el.adapter.extractHTMLForCheck());
      }
      Q.all(htmls).then(_.bind(function (results) {
        //console.log(results);
        var html = '';
        for (var i = 0; i < this.adapters.length; i++) {
          var el = this.adapters[i];
          var tag = this.getWrapperTag(el.wrapper);
          var startText = '<' + el.wrapper +  ' id="' + el.id + '">';
          var elHtml = results[i].html;//el.adapter.extractHTMLForCheck().html;
          var newTag = startText + elHtml + '</' + tag + '>';
          el.start = html.length + startText.length;
          el.end = html.length + startText.length + elHtml.length;
          html += newTag;

        }
        this.html = html;
        console.log(this.html);

        deferred.resolve({html: this.html});
      },this));
      return deferred.promise;

      //var html = '';
      //for (var i = 0; i < this.adapters.length; i++) {
      //  var el = this.adapters[i];
      //  var tag = this.getWrapperTag(el.wrapper);
      //  var startText = '<' + el.wrapper +  ' id="' + el.id + '">';
      //  var elHtml = el.adapter.extractHTMLForCheck().html;
      //  var newTag = startText + elHtml + '</' + tag + '>';
      //  el.start = html.length + startText.length;
      //  el.end = html.length + startText.length + elHtml.length;
      //  html += newTag;
      //
      //}
      //this.html = html;
      //console.log(this.html);
      //
      //return {html: this.html};
    },

    registerCheckCall: function (checkInfo) {

    },


    registerCheckResult: function (checkResult) {
      this.checkResult = checkResult;
      this.adapters.forEach(function (entry) {
        entry.adapter.registerCheckResult(checkResult);
      });
      return [];
    },

    selectRanges: function (checkId, matches) {
      var map = this.remapMatches(matches);
      for (var id in map) {

        map[id].adapter.selectRanges(checkId, map[id].matches);
      }

    },

    remapMatches: function (matches) {

      var map = {};
      for (var i = 0; i < matches.length; i++) {
        var match = _.clone(matches[i]);
        match.range = _.clone(matches[i].range);
        var adapter = this.getAdapterForMatch(match);
        if (!map.hasOwnProperty(adapter.id)) {
          map[adapter.id] = {matches: [], adapter: adapter.adapter};
        }

        match.range[0] -= adapter.start;
        match.range[1] -= adapter.start;
        map[adapter.id].matches.push(match);

      }

      return map;
    },

    getAdapterForMatch: function (match) {
      for (var i = 0; i < this.adapters.length; i++) {
        var el = this.adapters[i];
        if ((match.range[0] >= el.start) && (match.range[1] <= el.end)) {
          return el;
        }
      }
      return null;

    },
    replaceRanges: function (checkId, matchesWithReplacement) {
      var map = this.remapMatches(matchesWithReplacement);
      for (var id in map) {

        map[id].adapter.replaceRanges(checkId, map[id].matches);
      }
    }


  };

  return cls;
})();
// Source: src/adapters/TinyMCEAdapter.js
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
/*global tinymce */

var TinyMCEAdapter = (function () {
  var cls = function (conf) {
    this.config = conf;
    this.editorId = conf.editorId;
    this.editor = null;

  };


  cls.prototype = {
    getEditor: function () {
      if (this.editor === null) {
        this.editor = tinymce.get(this.editorId);
        console.log("tinymce found",this.editor);
      }
      return this.editor;
    },

    getHTML: function () {
      return this.getEditor().getContent();
    },

    getEditorDocument: function () {
      try {
        return this.editor.contentDocument;
      } catch (error) {
        throw error;
      }
    },

    getCurrentText: function () {
      try {
        return rangy.innerText(this.getEditorDocument());
      } catch (error) {
        throw error;
      }
    },

    selectText: function (begin, length) {
      var doc = this.getEditorDocument();
      var selection = rangy.getSelection(doc);
      var range = rangy.createRange(doc);

      range.moveStart('character', begin);
      range.moveEnd('character', length);
      selection.setSingleRange(range);
      return range;
    },

    scrollIntoView2: function (sel) {
      var range = sel.getRng();
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
      range1 = this.selectText(newBegin, matchLength);
      //$(getEditor().getBody()).find('em').get(0).scrollIntoView();
      selection1 = this.getEditor().selection;

      if (selection1) {
        try {
          //selection1.scrollIntoView();
          this.scrollIntoView2(selection1);
          //Special hack for WordPress TinyMCE
          var wpContainer = $('#wp-content-editor-container');
          if (wpContainer.length > 0) {
            wpContainer.get(0).scrollIntoView();
          }
        } catch (error) {
          console.log("Scrolling Error!");
        }
      }
      //
      // scrollIntoView need to set it again
      range2 = this.selectText(newBegin, matchLength);
    },

    extractHTMLForCheck: function () {
      //var checkCallResult,
      //  startTime = new Date().getTime();

      this.html = this.getHTML();
      this.currentHtmlChecking = this.html;
      return {html: this.html};
    },

    registerCheckCall: function (checkInfo) {

    },


    registerCheckResult: function (checkResult) {
      this.isCheckingNow = false;
      this.currentHtmlChecking = this.html;
      this.prevCheckedHtml = this.currentHtmlChecking;
      return [];
    },

    selectRanges:function (checkId, matches) {
      this.selectMatches(checkId, matches);
    },

    selectMatches:function (checkId, matches) {
      var rangyFlagOffsets,
        index,
        offset;

      var rangyText = this.getCurrentText();

      matches = AcrSelectionUtils.addPropertiesToMatches(matches,this.currentHtmlChecking);

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

    replaceRanges:function (checkId, matchesWithReplacement) {
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
      this.editor.selection.setContent(replacementText);

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

    },

  };

  return cls;

})();
// Source: src/adapters/simpleTextAdapter.js
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

var SimpleTextAdapter = (function () {
  var cls = function (conf) {
    this.config = conf;
  };


  cls.prototype = {


    selectText: function (begin, length) {
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
    },


    findRangesPositionInPlainText: function (text, matches) {
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
    },

    getEditor: function () {
      return document.getElementById(this.config.editorId);
    },

    getEditorElement: function () {
      return this.getEditor();
    },

    getCurrentText: function () {
      return rangy.innerText(this.getEditorElement());
    },

    getHTML: function () {
      return this.getEditor().innerHTML;
    },

    extractHTMLForCheck : function () {
      return {html:this.getHTML()};
    },



    registerCheckCall : function (checkInfo) {

    },


    registerCheckResult: function (checkResult) {
      return [];
    },


    selectRanges: function (checkId, matches) {
      var positionInPlainText = this.findRangesPositionInPlainText(this.getCurrentText(), matches);
      if (positionInPlainText) {
        this.selectText(positionInPlainText.start, positionInPlainText.length);
        // In a complete plugin we should also scroll to the selected text.
      } else {
        window.alert('Sorry, but I can\'t select this issue.');
      }

    },

    replaceRanges: function (checkId, matchesWithReplacement) {
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

  };

  return cls;
})();
// Source: src/multi_plugin.js
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

var AcrolinxPlugin = (function () {

    var clientComponents = [
        {
            id: 'com.acrolinx.sidebarexample',
            name: 'Acrolinx Sidebar Example Client',
            version: '1.2.3.999',
            category: 'MAIN'
        }
    ];

    function initAcrolinxSamplePlugin(config, editorAdapter) {
        var $sidebarContainer = $('#' + config.sidebarContainerId);
        var $sidebar = $('<iframe></iframe>');
        $sidebarContainer.append($sidebar);
        var sidebarContentWindow = $sidebar.get(0).contentWindow;

        var adapter = editorAdapter;

        function onSidebarLoaded() {
            function initSidebarCloud() {
                if (config.requestAccessTokenCallback !== undefined) {
                    config.requestAccessTokenCallback(function (accessToken) {
                        sidebarContentWindow.acrolinxSidebar.init(_.extend({
                            clientComponents: config.clientComponents || clientComponents,
                            token: accessToken,
                            contentPieceUuid: config.documentId,
                        },config));
                    });
                } else {
                    sidebarContentWindow.acrolinxSidebar.init(_.extend({
                        clientComponents: config.clientComponents || clientComponents,
                    },config));

                }
            }

            function initSidebarOnPremise() {
                sidebarContentWindow.acrolinxSidebar.init({
                    clientComponents: config.clientComponents || clientComponents,
                    clientSignature: config.clientSignature,
                    showServerSelector: config.hasOwnProperty("showServerSelector") ? config.showServerSelector : true,
                    serverAddress: config.serverAddress

                    // These settings are only effective on servers with disabled checking profiles.
                    //checkSettings: {
                    //  'language': 'en',
                    //  'ruleSetName': 'Plain English',
                    //  'termSets': ['Medical'],
                    //  'checkSpelling': true,
                    //  'checkGrammar': true,
                    //  'checkStyle': true,
                    //  'checkReuse': false,
                    //  'harvestTerms': false,
                    //  'checkSeo': false,
                    //  'termStatuses': ['TERMINOLOGY_DEPRECATED']
                    //}

                    // These settings are only effective on servers with disabled checking profiles.
                    //defaultCheckSettings: {
                    //  'language': 'en',
                    //  'ruleSetName': 'Plain English',
                    //  'termSets': ['Medical'],
                    //  'checkSpelling': true,
                    //  'checkGrammar': true,
                    //  'checkStyle': true,
                    //  'checkReuse': false,
                    //  'harvestTerms': false,
                    //  'checkSeo': false,
                    //  'termStatuses': ['TERMINOLOGY_DEPRECATED']
                    //}

                });
            }

            console.log('Install acrolinxPlugin in sidebar.');
            sidebarContentWindow.acrolinxPlugin = {

                requestInit: function () {
                    console.log('requestInit');
                    if (config.sidebarType === 'CLOUD') {
                        initSidebarCloud();
                    } else {
                        initSidebarOnPremise();
                    }
                },

                onInitFinished: function (initFinishedResult) {
                    console.log('onInitFinished: ', initFinishedResult);
                    if (initFinishedResult.error) {
                        window.alert(initFinishedResult.error.message);
                    }
                },

                configure: function (configuration) {
                    console.log('configure: ', configuration);
                },

                requestAccessToken: function () {
                    var requestAccessTokenCallback = config.requestAccessTokenCallback;
                    if (requestAccessTokenCallback) {
                        requestAccessTokenCallback(function (accessToken) {
                            sidebarContentWindow.acrolinxSidebar.setAccessToken(accessToken);
                        });
                    }
                },


                requestGlobalCheckSync: function (html, format, documentReference) {
                    if (html.hasOwnProperty("error")) {
                        window.alert(html.error);
                    } else {
                        var checkInfo = sidebarContentWindow.acrolinxSidebar.checkGlobal(html.html, {
                            inputFormat: format || 'HTML',
                            requestDescription: {
                                documentReference: documentReference || 'filename.html'
                            }
                        });
                        adapter.registerCheckCall(checkInfo);
                    }

                },

                requestGlobalCheck: function () {
                    console.log('requestGlobalCheck');
                    var pHtml = adapter.extractHTMLForCheck();
                    var pFormat = adapter.getFormat ? adapter.getFormat() : null;
                    var pDocumentReference = adapter.getDocumentReference ? adapter.getDocumentReference() : null;
                    if (pHtml.then !== undefined) {
                        var self = this;
                        pHtml.then(function (html) {
                            self.requestGlobalCheckSync(html, pFormat, pDocumentReference);
                        });
                    } else {
                        this.requestGlobalCheckSync(pHtml, pFormat, pDocumentReference);

                    }
                },

                onCheckResult: function (checkResult) {
                    return adapter.registerCheckResult(checkResult);
                },

                selectRanges: function (checkId, matches) {
                    console.log('selectRanges: ', checkId, matches);
                    adapter.selectRanges(checkId, matches);

                },

                replaceRanges: function (checkId, matchesWithReplacement) {
                    console.log('replaceRanges: ', checkId, matchesWithReplacement);
                    adapter.replaceRanges(checkId, matchesWithReplacement);

                },

                // only needed for local checks
                getRangesOrder: function (checkedDocumentRanges) {
                    console.log('getRangesOrder: ', checkedDocumentRanges);
                    return [];
                },

                download: function (download) {
                    console.log('download: ', download.url, download);
                    window.open(download.url);
                },

                // only needed for local checks
                verifyRanges: function (checkedDocumentParts) {
                    console.log('verifyRanges: ', checkedDocumentParts);
                    return [];
                },

                disposeCheck: function (checkId) {
                    console.log('disposeCheck: ', checkId);
                }
            };

        }

        function loadSidebarIntoIFrame() {
            var sidebarBaseUrl;
            if (config.sidebarUrl !== undefined) {
                sidebarBaseUrl = config.sidebarUrl;
            } else {
                sidebarBaseUrl = config.sidebarType === 'CLOUD' ?
                  'https://acrolinx-integrations.acrolinx-cloud.com/sidebar/v13/' :
                  'https://acrolinx-sidebar-classic.s3.amazonaws.com/v13/prod/';
            }
            return $.ajax({
                url: sidebarBaseUrl + 'index.html'
            }).then(function (sidebarHtml) {
                var sidebarHtmlWithAbsoluteLinks = sidebarHtml
                    .replace(/src="/g, 'src="' + sidebarBaseUrl)
                    .replace(/href="/g, 'href="' + sidebarBaseUrl);
                sidebarContentWindow.document.open();
                sidebarContentWindow.document.write(sidebarHtmlWithAbsoluteLinks);
                sidebarContentWindow.document.close();
                onSidebarLoaded();
            });
        }

        loadSidebarIntoIFrame();
    }

    var cls = function (conf) {
        this.config = conf;
    };

    cls.prototype = {

        registerAdapter: function (adapter) {
            this.adapter = adapter;
        },

        init: function () {
            initAcrolinxSamplePlugin(this.config, this.adapter);
        }
    };


    return cls;

})();