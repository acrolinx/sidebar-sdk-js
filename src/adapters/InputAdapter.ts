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
  import lookupMatchesStandard = acrolinx.plugins.lookup.diffbased.lookupMatches;
  import _ = acrolinxLibs._;

  export class InputAdapter implements AdapterInterface {
    element: any;
    html: any;
    currentHtmlChecking: any;
    lookupMatches = lookupMatchesStandard;

    constructor(elementOrConf: Element | AdapterConf) {
      if (elementOrConf instanceof Element) {
        this.element = elementOrConf;
      } else {
        const conf = elementOrConf as AdapterConf;
        this.element = document.getElementById(conf.editorId);
        if (conf.lookupMatches) {
          this.lookupMatches = conf.lookupMatches;
        }
      }
    }

    getHTML() {
      return acrolinxLibs.$(this.element).val();
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
        return this.getHTML();
      } catch (error) {
        throw error;
      }
    }

    extractHTMLForCheck() {
      this.html = this.getHTML();
      this.currentHtmlChecking = this.html;
      return {html: this.html};
    }

    registerCheckResult(checkResult) {
      return [];
    }

    registerCheckCall(checkInfo) {

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
      var newBegin, matchLength;
      var $ = acrolinxLibs.$;

      newBegin = matches[0].foundOffset;
      matchLength = matches[0].flagLength;

      $(this.element).focus();
      $(this.element).setSelection(newBegin, newBegin + matchLength);

      $(this.element)[0].scrollIntoView();
      var wpContainer = $('#wp-content-editor-container');
      if (wpContainer.length > 0) {
        window.scrollBy(0, -50);
      }
    }

    selectRanges(checkId, matches) {
      this.selectMatches(checkId, matches);
    }

    selectMatches(checkId, matches: MatchWithReplacement[]) : AlignedMatch[] {
      const alignedMatches = this.lookupMatches(this.currentHtmlChecking, this.getCurrentText(), matches);

      if (_.isEmpty(alignedMatches)) {
        throw 'Selected flagged content is modified.';
      }

      this.scrollAndSelect(alignedMatches);
      return alignedMatches;
    }

    replaceSelection(content) {
      //$(this.element).focus();
      acrolinxLibs.$(this.element).replaceSelectedText(content, "select");
    }

    replaceRanges(checkId, matchesWithReplacement: MatchWithReplacement[]) {
      try {
        // this is the selection on which replacement happens
        const alignedMatches = this.selectMatches(checkId, matchesWithReplacement);

        // Select the replacement, as replacement of selected flag will be done
        this.scrollAndSelect(alignedMatches);

        const replacementText = _.map(alignedMatches, 'replacement').join('');
        this.replaceSelection(replacementText);
      } catch (error) {
        console.log(error);
        return;
      }
    }
  }
}