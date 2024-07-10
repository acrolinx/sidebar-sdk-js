/*
 * Copyright 2015-present Acrolinx GmbH
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

import * as _ from 'lodash';
import { Check, DocumentSelection, Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { lookupMatches } from '../lookup/diff-based';
import { getAutobindWrapperAttributes } from '../utils/adapter-utils';
import { AlignedMatch } from '../utils/alignment';
import { isChrome } from '../utils/detect-browser';
import { getCompleteFlagLength } from '../utils/match';
import { scrollIntoView, scrollIntoViewCenteredWithFallback } from '../utils/scrolling';
import { extractTextDomMapping, getEndDomPos, TextDomMapping } from '../utils/text-dom-mapping';
import { assertElementIsDisplayed, simulateInputEvent, removeNode } from '../utils/utils';
import {
  AdapterConf,
  AdapterInterface,
  AutobindWrapperAttributes,
  ContentExtractionResult,
  ExtractContentForCheckOpts,
  SuccessfulCheckResult,
} from './AdapterInterface';

type TextMapping = TextDomMapping;

// TODO: if you want to extend this adapter with asynchronous methods,
//  then you will have to implement AsyncAdapterInterface at the same time
// If you make changes here make sure to see AsyncContentEditableAdapter,
// there are some similar methods with asynchronous calls

export abstract class AbstractRichtextEditorAdapter implements AdapterInterface {
  config: AdapterConf;
  currentContentChecking?: string;
  lastContentChecked?: string;

  protected constructor(conf: AdapterConf) {
    this.config = conf;
  }

  abstract getEditorDocument(): Document;

  abstract getContent(opts: ExtractContentForCheckOpts): string;

  protected getEditorElement(): HTMLElement {
    return this.getEditorDocument().querySelector('body')!;
  }

  registerCheckCall(_checkInfo: Check) {}

  registerCheckResult(_checkResult: SuccessfulCheckResult): void {
    this.lastContentChecked = this.currentContentChecking;
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): ContentExtractionResult | Promise<ContentExtractionResult> {
    const html = this.getContent(opts);
    this.currentContentChecking = html;
    return { content: html, selection: opts.checkSelection ? this.getSelection() : undefined };
  }

  protected getSelection(): DocumentSelection {
    return { ranges: [] };
  }

  protected scrollIntoView(sel: Selection): void | Promise<void> {
    const range = sel.getRangeAt(0);
    const tmp = range.cloneRange();
    tmp.collapse(true);

    const text = document.createElement('span');
    tmp.insertNode(text);
    sel.removeAllRanges();
    sel.addRange(range);
    text.focus();
    this.scrollElementIntoView(text);
    removeNode(text);

    removeEmptyTextNodesIfNeeded(tmp);
  }

  scrollToCurrentSelection() {
    const selection1 = this.getEditorDocument().getSelection();

    if (selection1) {
      try {
        this.scrollIntoView(selection1);
      } catch (error) {
        console.log('Scrolling Error: ', error);
      }
    }
  }

  protected scrollElementIntoView(el: HTMLElement) {
    scrollIntoView(el, this.config.scrollOffsetY);
  }

  selectRanges(checkId: string, matches: Match[]): void | Promise<void> {
    assertElementIsDisplayed(this.getEditorElement());
    this.selectMatches(checkId, matches);
    if (this.isQuillEditor() || this.isCkEditor5()) {
      // Simple workaround for quill/CKEditor5 editor, as 'scrollIntoView' is messing up the selection range there.
      const selection = this.getEditorDocument().getSelection();
      if (selection && selection.anchorNode && selection.anchorNode.parentElement) {
        scrollIntoViewCenteredWithFallback(selection.anchorNode.parentElement);
      }
    } else {
      this.scrollToCurrentSelection();
    }
  }

  protected isCkEditor5(): boolean {
    return this.getEditorElement().classList.contains('ck-editor__editable');
  }

  protected isQuillEditor(): boolean {
    const editorElementIsQuill = this.getEditorElement().classList.contains('ql-editor');
    const editorElementContainsQuill = !!this.getEditorElement().querySelector('.ql-editor');
    return editorElementIsQuill || editorElementContainsQuill;
  }

  protected selectMatches<T extends Match>(_checkId: string, matches: T[]): [AlignedMatch<T>[], TextMapping] {
    const textMapping: TextMapping = this.getTextDomMapping();
    const alignedMatches: AlignedMatch<T>[] = lookupMatches(this.lastContentChecked!, textMapping.text, matches);

    if (_.isEmpty(alignedMatches)) {
      throw new Error('Selected flagged content is modified.');
    }

    this.selectAlignedMatches(alignedMatches, textMapping);
    return [alignedMatches, textMapping];
  }

  protected selectAlignedMatches(matches: AlignedMatch<Match>[], textMapping: TextMapping) {
    const newBegin = matches[0].range[0];
    const matchLength = getCompleteFlagLength(matches);
    this.selectText(newBegin, matchLength, textMapping);
  }

  protected selectText(begin: number, length: number, textMapping: TextMapping) {
    if (!textMapping.text) {
      return;
    }

    const selection = this.getEditorDocument().getSelection();

    if (!selection) {
      console.warn('AbstractRichtextEditorAdapter.selectText: Missing selection');
      return;
    }

    selection.removeAllRanges();
    selection.addRange(this.createRange(begin, length, textMapping));
  }

  protected createRange(begin: number, length: number, textMapping: TextMapping) {
    const doc = this.getEditorDocument();
    const range = doc.createRange();
    const beginDomPosition = textMapping.domPositions[begin];
    const endDomPosition = getEndDomPos(begin + length, textMapping.domPositions);

    // TODO: Handle overflowing offsets more clever and safer
    if (beginDomPosition.offset <= beginDomPosition.node.textContent!.length) {
      range.setStart(beginDomPosition.node, beginDomPosition.offset);
    } else {
      console.warn(
        `Offset of range begin (${beginDomPosition.offset}) > node text length (${
          beginDomPosition.node.textContent!.length
        })`,
      );
    }

    if (endDomPosition.offset <= endDomPosition.node.textContent!.length) {
      range.setEnd(endDomPosition.node, endDomPosition.offset);
    } else {
      console.warn(
        `Offset of range end (${endDomPosition.offset}) > node text length (${
          endDomPosition.node.textContent!.length
        })`,
      );
    }

    return range;
  }

  protected replaceAlignedMatches(matches: AlignedMatch<MatchWithReplacement>[]) {
    const doc = this.getEditorDocument();
    const reversedMatches = _.clone(matches).reverse();
    for (const match of reversedMatches) {
      const textDomMapping = this.getTextDomMapping();
      const rangeLength = match.range[1] - match.range[0];
      if (rangeLength > 1) {
        const tail = this.createRange(match.range[0] + 1, rangeLength - 1, textDomMapping);
        const head = this.createRange(match.range[0], 1, textDomMapping);
        const completeRange = this.createRange(match.range[0], rangeLength, textDomMapping);

        const { startOffset, endOffset } = completeRange;
        simulateInputEvent({
          node: completeRange.startContainer,
          eventType: 'beforeinput',
          replacement: match.originalMatch.replacement,
          startOffset,
          endOffset,
          disableSimulation: this.config.disableInputEventSimulation,
        });

        tail.deleteContents();
        head.deleteContents();
        if (match.originalMatch.replacement.length !== 0) {
          head.insertNode(doc.createTextNode(match.originalMatch.replacement));
        }

        simulateInputEvent({
          node: completeRange.startContainer,
          eventType: 'input',
          replacement: match.originalMatch.replacement,
          startOffset,
          endOffset,
          disableSimulation: this.config.disableInputEventSimulation,
        });

        removeEmptyTextNodesIfNeeded(tail);
        if (tail.startContainer !== head.startContainer || tail.endContainer !== head.endContainer) {
          removeEmptyTextNodesIfNeeded(head);
        }
      } else {
        const range = this.createRange(match.range[0], rangeLength, textDomMapping);

        const { startOffset, endOffset } = range;
        simulateInputEvent({
          node: range.startContainer,
          eventType: 'beforeinput',
          replacement: match.originalMatch.replacement,
          startOffset,
          endOffset,
          disableSimulation: this.config.disableInputEventSimulation,
        });

        range.deleteContents();
        if (match.originalMatch.replacement.length !== 0) {
          range.insertNode(doc.createTextNode(match.originalMatch.replacement));
        }

        simulateInputEvent({
          node: range.startContainer,
          eventType: 'input',
          replacement: match.originalMatch.replacement,
          startOffset,
          endOffset,
          disableSimulation: this.config.disableInputEventSimulation,
        });

        removeEmptyTextNodesIfNeeded(range);
      }
    }
  }

  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): void | Promise<void> {
    assertElementIsDisplayed(this.getEditorElement());
    const [alignedMatches] = this.selectMatches(checkId, matchesWithReplacement);
    const replacement = alignedMatches.map((m) => m.originalMatch.replacement).join('');

    this.replaceAlignedMatches(alignedMatches);

    // Replacement will remove the selection, so we need to restore it again.
    this.selectText(alignedMatches[0].range[0], replacement.length, this.getTextDomMapping());
    this.scrollToCurrentSelection();
  }

  protected getTextDomMapping() {
    return extractTextDomMapping(this.getEditorElement());
  }

  getAutobindWrapperAttributes(): AutobindWrapperAttributes {
    return getAutobindWrapperAttributes(this.getEditorElement());
  }
}

// Workaround for https://bugs.chromium.org/p/chromium/issues/detail?id=811630.
export function removeEmptyTextNodesIfNeeded(range: Range) {
  // This code is just an workaround for a hopefully temporally chrome browser bug.
  // We don't want to risk, that it causes any problems, if not really necessary.
  try {
    if (isChrome()) {
      removeEmptyTextNodes(range);
    }
  } catch (error) {
    console.error('Error in removeEmptyTextNodesIfNeeded:', error);
  }
}

export function removeEmptyTextNodes(range: Range) {
  const nodeIterator = document.createNodeIterator(range.commonAncestorContainer);
  let currentNode: Node | null;
  let afterStartNode = false;

  while ((currentNode = nodeIterator.nextNode())) {
    if (currentNode === range.startContainer) {
      afterStartNode = true;
    }

    if (afterStartNode) {
      removeIfEmptyTextNode(currentNode);
      if (currentNode === range.endContainer) {
        break;
      }
    }
  }
}

function removeIfEmptyTextNode(node: Node) {
  if (node.nodeType === Node.TEXT_NODE && node.textContent === '') {
    removeNode(node);
  }
}
