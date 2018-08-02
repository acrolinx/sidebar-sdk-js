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

import {Match, MatchWithReplacement, Check, DocumentSelection} from "../acrolinx-libs/plugin-interfaces";
import * as _ from "lodash";
import {isChrome} from '../utils/detect-browser';
import {TextDomMapping, extractTextDomMapping, getEndDomPos} from "../utils/text-dom-mapping";
import {AlignedMatch} from "../utils/alignment";
import {lookupMatches} from "../lookup/diff-based";
import {getCompleteFlagLength} from "../utils/match";
import {fakeInputEvent, assertElementIsDisplayed, removeNode} from "../utils/utils";
import {
  AdapterInterface, AdapterConf, ContentExtractionResult, AutobindWrapperAttributes,
  ExtractContentForCheckOpts, SuccessfulCheckResult
} from "./AdapterInterface";
import {getAutobindWrapperAttributes} from "../utils/adapter-utils";


type TextMapping = TextDomMapping;

export abstract class AbstractRichtextEditorAdapter implements AdapterInterface {
  config: AdapterConf;
  currentContentChecking?: string;
  lastContentChecked?: string;

  protected constructor(conf: AdapterConf) {
    this.config = conf;
  }

  abstract getEditorDocument(): Document;

  abstract getContent(): string;

  protected getEditorElement(): Element {
    return this.getEditorDocument().querySelector('body')!;
  }

  registerCheckCall(_checkInfo: Check) {
  }

  registerCheckResult(_checkResult: SuccessfulCheckResult): void {
    this.lastContentChecked = this.currentContentChecking;
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): ContentExtractionResult {
    const html = this.getContent();
    this.currentContentChecking = html;
    return {content: html, selection: opts.checkSelection ? this.getSelection() : undefined};
  }

  protected getSelection(): DocumentSelection | undefined {
    return undefined;
  }

  private scrollIntoView(sel: Selection) {
    const range = sel.getRangeAt(0);
    const tmp = range.cloneRange();
    tmp.collapse(true);

    const text = document.createElement('span');
    tmp.insertNode(text);
    sel.removeAllRanges();
    sel.addRange(range);
    text.focus();
    text.scrollIntoView();
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
    el.scrollIntoView();
  }

  selectRanges(checkId: string, matches: Match[]) {
    assertElementIsDisplayed(this.getEditorElement());
    this.selectMatches(checkId, matches);
    this.scrollToCurrentSelection();
  }


  private selectMatches<T extends Match>(_checkId: string, matches: T[]): [AlignedMatch<T>[], TextMapping] {
    const textMapping: TextMapping = this.getTextDomMapping();
    const alignedMatches: AlignedMatch<T>[] = lookupMatches(this.lastContentChecked!, textMapping.text, matches);

    if (_.isEmpty(alignedMatches)) {
      throw new Error('Selected flagged content is modified.');
    }

    this.selectAlignedMatches(alignedMatches, textMapping);
    return [alignedMatches, textMapping];
  }

  private selectAlignedMatches(matches: AlignedMatch<Match>[], textMapping: TextMapping) {
    const newBegin = matches[0].range[0];
    const matchLength = getCompleteFlagLength(matches);
    this.selectText(newBegin, matchLength, textMapping);
  }

  private selectText(begin: number, length: number, textMapping: TextMapping) {
    if (!textMapping.text) {
      return;
    }
    const doc = this.getEditorDocument();
    const selection = doc.getSelection();
    selection.removeAllRanges();
    selection.addRange(this.createRange(begin, length, textMapping));
  }

  private createRange(begin: number, length: number, textMapping: TextMapping) {
    const doc = this.getEditorDocument();
    const range = doc.createRange();
    const beginDomPosition = textMapping.domPositions[begin];
    const endDomPosition = getEndDomPos(begin + length, textMapping.domPositions);

    // TODO: Handle overflowing offsets more clever and safer
    if (beginDomPosition.offset <= beginDomPosition.node.textContent!.length) {
      range.setStart(beginDomPosition.node, beginDomPosition.offset);
    } else {
      console.warn(`Offset of range begin (${beginDomPosition.offset}) > node text length (${beginDomPosition.node.textContent!.length})`);
    }

    if (endDomPosition.offset <= endDomPosition.node.textContent!.length) {
      range.setEnd(endDomPosition.node, endDomPosition.offset);
    } else {
      console.warn(`Offset of range end (${endDomPosition.offset}) > node text length (${endDomPosition.node.textContent!.length})`);
    }

    return range;
  }

  private replaceAlignedMatches(matches: AlignedMatch<MatchWithReplacement>[]) {
    const doc = this.getEditorDocument();
    const reversedMatches = _.clone(matches).reverse();
    for (let match of reversedMatches) {
      const textDomMapping = this.getTextDomMapping();
      const rangeLength = match.range[1] - match.range[0];
      if (rangeLength > 1) {
        const tail = this.createRange(match.range[0] + 1, rangeLength - 1, textDomMapping);
        const head = this.createRange(match.range[0], 1, textDomMapping);
        tail.deleteContents();
        head.deleteContents();
        head.insertNode(doc.createTextNode(match.originalMatch.replacement));

        removeEmptyTextNodesIfNeeded(tail);
        if (tail.startContainer !== head.startContainer || tail.endContainer !== head.endContainer) {
          removeEmptyTextNodesIfNeeded(head);
        }
      } else {
        const range = this.createRange(match.range[0], rangeLength, textDomMapping);
        range.deleteContents();
        range.insertNode(doc.createTextNode(match.originalMatch.replacement));

        removeEmptyTextNodesIfNeeded(range);
      }
    }
  }

  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    assertElementIsDisplayed(this.getEditorElement());
    const [alignedMatches] = this.selectMatches(checkId, matchesWithReplacement);
    const replacement = alignedMatches.map(m => m.originalMatch.replacement).join('');
    this.replaceAlignedMatches(alignedMatches);

    // Replacement will remove the selection, so we need to restore it again.
    this.selectText(alignedMatches[0].range[0], replacement.length, this.getTextDomMapping());
    this.scrollToCurrentSelection();
    fakeInputEvent(this.getEditorElement());
  }

  private getTextDomMapping() {
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
  while (currentNode = nodeIterator.nextNode()) {
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

