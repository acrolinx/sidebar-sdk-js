/**
 * Created by pricope on 8/31/2015.
 */

'use strict';
var CKEditorAdapter = (function () {
  var cls = function (conf) {
    this.config = conf;

    CKEDITOR.plugins.add('acrolinx', {
      icons: 'acrolinx',
      init: _.bind(onCkInit, this)
    });


  };

  var onCkInit = function (editor) {
    this.editor = editor;
  };


  cls.prototype = {


    getEditor: function () {
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
      //var checkCallResult,
      //  startTime = new Date().getTime();

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

        //try {
        this.selectMatches(checkId, matches);
        //} catch (error) {
        //
        //  //window.alert(error);
        //  console.log(error);
        //  return;
        //}

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