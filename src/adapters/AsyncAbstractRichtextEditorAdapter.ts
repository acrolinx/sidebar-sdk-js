/*
 * Copyright 2020-present Acrolinx GmbH
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
import {Match, MatchWithReplacement} from '@acrolinx/sidebar-interface';
import {lookupMatches} from '../lookup/diff-based';
import {AlignedMatch} from '../utils/alignment';
import {getCompleteFlagLength} from '../utils/match';
import {TextDomMapping} from '../utils/text-dom-mapping';
import {assertElementIsDisplayed, fakeInputEvent} from '../utils/utils';
import {
  AsyncAdapterInterface} from './AdapterInterface';
import { AbstractRichtextEditorAdapter, removeEmptyTextNodesIfNeeded } from './AbstractRichtextEditorAdapter';


type TextMapping = TextDomMapping;

// TODO: if you want to extend this adapter with asynchronous methods,
//  then you will have to implement AsyncAdapterInterface at the same time

export abstract class AsyncAbstractRichtextEditorAdapter extends AbstractRichtextEditorAdapter implements AsyncAdapterInterface {
  readonly isAsync: true = true;
  readonly requiresSynchronization: true = true;
  currentContentChecking?: string;
  lastContentChecked?: string;

  protected async scrollIntoView(sel: Selection): Promise<void> {
    const range = sel.getRangeAt(0);
    const tmp = range.cloneRange();
    tmp.collapse(true);
    
    sel.removeAllRanges();
    await this.addSelectionRange(sel, range);
    const containerElement = range.startContainer.parentElement;
    if (containerElement) {
      containerElement.focus();
      this.scrollElementIntoView(containerElement);
    }
  }

  async scrollToCurrentSelection() {
    const selection1 = this.getEditorDocument().getSelection();

    if (selection1) {
      try {
        await this.scrollIntoView(selection1);
      } catch (error) {
        console.log('Scrolling Error: ', error);
      }
    }
  }

  async selectRanges(checkId: string, matches: Match[]): Promise<void> {
    assertElementIsDisplayed(this.getEditorElement());
    this.getEditorElement().click();
    await this.selectMatchesAsync(checkId, matches);
    await this.scrollToCurrentSelection();
    
  }

  private async selectMatchesAsync<T extends Match>(_checkId: string, matches: T[]): Promise<[AlignedMatch<T>[], TextMapping]> {
    const textMapping: TextMapping = this.getTextDomMapping();
    const alignedMatches: AlignedMatch<T>[] = lookupMatches(this.lastContentChecked!, textMapping.text, matches);

    if (_.isEmpty(alignedMatches)) {
      throw new Error('Selected flagged content is modified.');
    }

    await this.selectAlignedMatches(alignedMatches, textMapping);
    return [alignedMatches, textMapping];
  }

  protected async selectAlignedMatches(matches: AlignedMatch<Match>[], textMapping: TextMapping): Promise<void> {
    const newBegin = matches[0].range[0];
    const matchLength = getCompleteFlagLength(matches);
    return await this.selectText(newBegin, matchLength, textMapping);
  }

  protected async selectText(begin: number, length: number, textMapping: TextMapping): Promise<void > {
    if (!textMapping.text) {
      return;
    }
    const range = this.createRange(begin, length, textMapping);
    const selection = this.getEditorDocument().getSelection();

    if (!selection) {
      console.warn('AbstractRichtextEditorAdapter.selectText: Missing selection');
      return;
    }

    selection.removeAllRanges();
    return await this.addSelectionRange(selection, range);
  }

  private async addSelectionRange(selection: Selection, range: Range): Promise<void> {
    return new Promise(resolve => resolve(selection.addRange(range)));
  }

  protected replaceAlignedMatches(matches: AlignedMatch<MatchWithReplacement>[]) {
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


  async replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): Promise<void> {
    assertElementIsDisplayed(this.getEditorElement());
    const [alignedMatches] = await this.selectMatchesAsync(checkId, matchesWithReplacement);
    const replacement = alignedMatches.map(m => m.originalMatch.replacement).join('');
    this.replaceAlignedMatches(alignedMatches);

    // Replacement will remove the selection, so we need to restore it again.
    await this.selectText(alignedMatches[0].range[0], replacement.length, this.getTextDomMapping());
    await this.scrollToCurrentSelection();
    fakeInputEvent(this.getEditorElement());
  }

}

