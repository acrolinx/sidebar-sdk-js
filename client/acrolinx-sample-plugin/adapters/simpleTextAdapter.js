/**
 * Created by pricope on 8/31/2015.
 */

'use strict';

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



    //requestGlobalCheck: function(acrolinxSidebar) {
    //  var html = this.getHTML();//getHTML().trim();
    //  var checkInfo = acrolinxSidebar.checkGlobal(html, {
    //    inputFormat: 'HTML',
    //    requestDescription: {
    //      documentReference: 'filename.html'
    //    }
    //  });
    //  console.log('Got checkId:', checkInfo.checkId);
    //
    //},

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