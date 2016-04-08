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

    getCurrentText() {
      return this.getHTML();
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

    selectMatches(checkId, matches: MatchWithReplacement[]): AlignedMatch[] {
      const alignedMatches = this.lookupMatches(this.currentHtmlChecking, this.getCurrentText(), matches, 'TEXT');

      if (_.isEmpty(alignedMatches)) {
        throw 'Selected flagged content is modified.';
      }

      this.scrollAndSelect(alignedMatches);
      return alignedMatches;
    }

    replaceSelection(content: string) {
      //$(this.element).focus();
      acrolinxLibs.$(this.element).replaceSelectedText(content, "select");
    }

    replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
      const alignedMatches = this.selectMatches(checkId, matchesWithReplacement);
      this.scrollAndSelect(alignedMatches);
      const replacementText = _.map(alignedMatches, 'replacement').join('');
      this.replaceSelection(replacementText);
    }
  }
}