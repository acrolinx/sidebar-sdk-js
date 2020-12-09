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
import { Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { TextDomMapping } from '../utils/text-dom-mapping';
import { assertElementIsDisplayed, fakeInputEvent } from '../utils/utils';
import {
  AsyncAdapterInterface
} from './AdapterInterface';
import { AbstractRichtextEditorAdapter } from './AbstractRichtextEditorAdapter';


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
    await this.selectMatches(checkId, matches);
    await this.scrollToCurrentSelection();

  }

  protected async selectText(begin: number, length: number, textMapping: TextMapping): Promise<void> {
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

  async replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): Promise<void> {
    assertElementIsDisplayed(this.getEditorElement());
    const [alignedMatches] = await this.selectMatches(checkId, matchesWithReplacement);
    const replacement = alignedMatches.map(m => m.originalMatch.replacement).join('');
    this.replaceAlignedMatches(alignedMatches);

    // Replacement will remove the selection, so we need to restore it again.
    await this.selectText(alignedMatches[0].range[0], replacement.length, this.getTextDomMapping());
    await this.scrollToCurrentSelection();
    fakeInputEvent(this.getEditorElement());
  }

}

