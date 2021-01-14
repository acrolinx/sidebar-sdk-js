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

import { getElementFromAdapterConf, AdapterConf, AsyncAdapterInterface } from './AdapterInterface';
import { DocumentSelection, Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { getSelectionHtmlRanges } from '../utils/check-selection';
import { AbstractRichtextEditorAdapter } from './AbstractRichtextEditorAdapter';
import { assertElementIsDisplayed, fakeInputEvent } from '../utils/utils';
import { TextDomMapping } from '../utils/text-dom-mapping';

type TextMapping = TextDomMapping;
// Asynchronous extension to synchronous AbstractRichTextAdapter. While working in this class make sure
// that if you need to add those also to the base class.
// Note: Replacement functionality does not work as expected in every state based adapter. If DOM based
// replacements are not supported by state based adapter, the replacements performed by this adapter
// are illusion.
export class AsyncContentEditableAdapter extends AbstractRichtextEditorAdapter implements AsyncAdapterInterface {
  element: HTMLElement;

  constructor(conf: AdapterConf) {
    super(conf);
    this.element = getElementFromAdapterConf(conf);
  }
  readonly isAsync: true = true;
  readonly requiresSynchronization: true = true;

  getEditorElement(): HTMLElement {
    return this.element;
  }

  getContent() {
    return this.element.innerHTML;
  }

  protected getSelection(): DocumentSelection {
    return { ranges: getSelectionHtmlRanges(this.getEditorElement()) };
  }

  getEditorDocument(): Document {
    return this.element.ownerDocument;
  }

  async selectRanges(checkId: string, matches: Match[]): Promise<void> {
    assertElementIsDisplayed(this.getEditorElement());
    this.getEditorElement().click();
    this.selectMatches(checkId, matches);
    this.scrollToCurrentSelection();
  }

  async replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): Promise<void> {
    assertElementIsDisplayed(this.getEditorElement());
    const [alignedMatches] = this.selectMatches(checkId, matchesWithReplacement);
    const replacement = alignedMatches.map(m => m.originalMatch.replacement).join('');
    this.replaceAlignedMatches(alignedMatches);

    // Replacement will remove the selection, so we need to restore it again.
    await this.selectText(alignedMatches[0].range[0], replacement.length, this.getTextDomMapping());
    this.scrollToCurrentSelection();
    fakeInputEvent(this.getEditorElement());
  }

  async selectText(begin: number, length: number, textMapping: TextMapping): Promise<void> {
    if (!textMapping.text) {
      return;
    }
    const range = this.createRange(begin, length, textMapping);
    const selection = this.getEditorDocument().getSelection();

    if (!selection) {
      console.warn('AsyncContentEditableAdapter.selectText: Missing selection');
      return;
    }

    selection.removeAllRanges();
    return await this.addSelectionRange(selection, range);
  }

  private async addSelectionRange(selection: Selection, range: Range): Promise<void> {
    return new Promise(resolve => resolve(selection.addRange(range)));
  }

  async scrollIntoView(sel: Selection): Promise<void> {
    const range = sel.getRangeAt(0);
    const tmp = range.cloneRange();
    tmp.collapse(true);

    const containerElement = range.startContainer.parentElement;
    if (containerElement) {
      containerElement.focus();
      this.scrollElementIntoView(containerElement);
    }
  }
}

export function isStateBasedEditor(el: Element) {
  // Add selectors for state based editors here.
  return el.closest('.DraftEditor-editorContainer, .akEditor');
}


