/*
 * Copyright 2018-present Xpublisher GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AdapterInterface, ExtractContentForCheckOpts, ContentExtractionResult, SuccessfulCheckResult } from './AdapterInterface';
import { Check, MatchWithReplacement, Match } from '@acrolinx/sidebar-interface';
import { lookupMatches } from '../lookup/diff-based';
import { AlignedMatch } from '../utils/alignment';

/*
 * Declare ExtJS
 */
declare const Ext: any;

interface CheckContentResult {
  dom: HTMLElement;
  text: string;
  html: string;
}

export class XeditorAdapter implements AdapterInterface {

  /**
   * Editor of this adapter
   *
   * @property {any} editor
   * Native Xeditor editor instance
   */
  protected editor: any;

  /**
   * Document of this adapter
   *
   * @property {any} editor
   * Native Xeditor document instance
   */
  protected document: any;

  /**
   * SelectionManager of this adapter
   *
   * @property {any} editor
   * Native Xeditor selection manager instance
   */
  protected selectionManager: any;

  /**
   * Content that is currently checking
   *
   * @property {string} currentContentChecking
   * Content that is currently checking
   */
  protected currentContentChecking: string;

  /**
   * Content that was last checked
   *
   * @property {string} lastContentChecked
   * Content that was last checked
   */
  protected lastContentChecked: string;

  /**
   * Creates a new instance of this acrolinx adapter
   */
  constructor(editor: any) {
    this.editor = editor;
    this.document = editor.document;
    this.selectionManager = editor.selectionManager;

    this.lastContentChecked = '';
    this.currentContentChecking = '';
  }

  /**
   * Implementation of getFormat of acrolinx.AdapterInterface
   *
   * @returns {string} Returns 'HTML'
   */
  getFormat(): string {
    return 'HTML';
  }

  /**
   * @inheritdoc
   */
  extractContentForCheck(_opts: ExtractContentForCheckOpts): ContentExtractionResult | Promise<ContentExtractionResult> {
    const content = this.getContentForCheck().html;
    this.currentContentChecking = content;
    return {
      content: content
    };
  }

  /**
   * @inheritdoc
   */
  registerCheckCall(_checkInfo: Check): void {

  }

  /**
   * @inheritdoc
   */
  registerCheckResult(_checkResult: SuccessfulCheckResult): void {
    this.lastContentChecked = this.currentContentChecking;
  }

  /**
   * @inheritdoc
   */
  replaceRanges(_checkId: string, matchesWithReplacement: MatchWithReplacement[]): void {
    const alignedMatches = this.selectMatches<MatchWithReplacement>(matchesWithReplacement);
    const replacement = alignedMatches.map(m => m.originalMatch.replacement).join('');
    this.replaceAlignedMatches(alignedMatches);

    // Replacement will remove the selection, so we need to restore it again.
    this.selectText(alignedMatches[0].range[0], replacement.length);
  }

  /**
   * @inheritdoc
   */
  selectRanges(_checkId: string, matches: Match[]): void {
    this.selectMatches(matches);
  }

  /**
   * Replaces the aligned matches.
   *
   * @param {AlignedMatch<MatchWithReplacement>[]} matches
   *             Matches to replace
   * @protected
   */
  replaceAlignedMatches(matches: AlignedMatch<MatchWithReplacement>[]): void {
    // sort matches by reverted range
    matches = matches.sort((a, b) => {
      return b.range[0] - a.range[0];
    });

    for (const match of matches) {
      this.document.replaceTextByOffsetRanges([{
        from: match.range[0],
        to: match.range[1]
      }], match.originalMatch.replacement);
    }

    this.editor.updateState(true);
  }

  /**
   * Selects the given `matches` by aligning them and calling `selectAlignedMatches`.
   *
   * @param {Match[]} matches
   *             Matches to select
   * @returns {AlignedMatch<T>[]} Aligned matches
   * @protected
   */
  selectMatches<T extends Match>(matches: Match[]): AlignedMatch<T>[] {
    const alignedMatches = lookupMatches(this.lastContentChecked, this.getContentForCheck().text, matches) as AlignedMatch<T>[];
    this.selectAlignedMatches(alignedMatches);
    return alignedMatches;
  }

  /**
   * Selects the given `matches` using `selectText`.
   *
   * @param {AlignedMatch<Match>[]} matches
   *             Aligned matches to select
   * @protected
   */
  selectAlignedMatches(matches: AlignedMatch<Match>[]): void {
    const startOffset = matches[0].range[0];
    const endOffset = matches[matches.length - 1].range[1];
    this.selectText(startOffset, endOffset);
  }

  /**
   * Selects the range for the given offset.
   *
   * @param {number} begin
   *             Begin of the range
   * @param {number} end
   *             End of the range
   * @protected
   */
  selectText(begin: number, end: number): void {
    const startOffset = this.document.findTextNodeByOffset(begin);
    const endOffset = this.document.findTextNodeByOffset(end);

    const activeSelection = this.selectionManager.getActive();

    activeSelection.startNode = startOffset.textNode;
    activeSelection.startOffset = Ext.ux.xeditor.Util.getNodeOffsetByNodeAndOffset(this.editor, startOffset.textNode, startOffset.offset);
    activeSelection.endNode = endOffset.textNode;
    activeSelection.endOffset = Ext.ux.xeditor.Util.getNodeOffsetByNodeAndOffset(this.editor, endOffset.textNode, endOffset.offset);

    this.editor.updateState();
    this.selectionManager.sync();

    // scroll to selection
    const scrollResult = this.editor.contentFrame.scrollToSelection('middle', true);
    if (scrollResult.selectionCorrected) {
      // update editor state and sync selection
      this.editor.updateState();
      this.selectionManager.sync();
    }
  }

  /**
   * Returns the prepared content for a check.
   *
   * @returns {CheckContentResult} Content to check
   * @protected
   */
  getContentForCheck(): CheckContentResult {
    const result = {
      dom: document.createElement('div'),
      html: '',
      text: ''
    };

    // use inner function for recursion to share the result
    const scope = this;
    function getContentForCheckInner(elementInner: any, resultParent: any) {
      // check for removed
      if (elementInner.isRemoved(true)) {
        return;
      }

      // check if element is a text element as a exception for text
      // elements exist
      const isTextElement = (elementInner.getType() === 'text');

      // handle children
      let insertSpaceAfter = false;
      elementInner.eachChildNode(function(child: any, _index: number, _len: number) {
        // check type
        const childType = scope.editor.document.getNodeType(child);
        if (isTextElement && childType === '#text') {
          // add text to result
          let textValue = scope.editor.document.getTextNodeValue(child);
          textValue = Ext.ux.xeditor.Util.trimPlaceHolderChar(scope.editor, textValue);
          const textNode = document.createTextNode(textValue);
          resultParent.appendChild(textNode);
        } else if (scope.editor.configObj.isElementType(childType)) {
          // get child element
          const childElement = scope.editor.document.getNode(child);
          const role = scope.editor.configObj.getRoleByType(childType);

          const element = scope.getAcrolinxElement(childElement, role, resultParent);

          // check if space must be added
          if (insertSpaceAfter) {
            const textNode = document.createTextNode(' ');
            element.appendChild(textNode);
          }

          // recursively process child nodes
          getContentForCheckInner(childElement, element);

          // set insert space after for next iteration
          insertSpaceAfter = role.insertSpaceAfter;
        }
      });
    }

    // use inner function
    getContentForCheckInner(this.document.root, result.dom);

    result.html = result.dom.outerHTML;
    result.text = result.dom.innerText;
    return result;
  }

  /**
   * Returns the specific element that should be used for the acrolinx check.
   *
   * @param {any} _element
   * Element to get the acrolinx element from
   * @param {any} role
   * Role of the passed `_element`
   * @param currentElement
   * Element which is currently used
   * @returns {HTMLElement} Element that should be used for acrolinx check
   */
  getAcrolinxElement(_element: any, role: any, currentElement: any): HTMLElement {
    if (role.isInline) {
      return currentElement;
    }

    // create element with given tag
    let newElement = document.createElement(role.tag);
    currentElement.appendChild(newElement);
    return newElement;
  }
}
