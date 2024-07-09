/*
 * Copyright 2019-present Acrolinx GmbH
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

import { DocumentSelection, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { waitMs } from '../utils/utils';
import { AbstractRichtextEditorAdapter } from './AbstractRichtextEditorAdapter';
import { AdapterConf, getElementFromAdapterConf } from './AdapterInterface';

/**
 * Just a proof of concept.
 */
export class QuipAdapter extends AbstractRichtextEditorAdapter {
  element: HTMLElement;

  constructor(conf: AdapterConf) {
    super(conf);
    this.element = getElementFromAdapterConf(conf);
    console.warn('QuipAdapter', this.element);
  }

  getEditorElement(): HTMLElement {
    return this.element;
  }

  getContent() {
    return this.element.innerHTML;
  }

  protected getSelection(): DocumentSelection {
    return { ranges: [] };
  }

  getEditorDocument(): Document {
    return this.element.ownerDocument;
  }

  async replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    super.replaceRanges(checkId, matchesWithReplacement);
    const selection = this.getEditorDocument().getSelection();

    const selectedNode = selection && selection.focusNode;
    if (!selectedNode) {
      console.warn('No selection after replacement.');
      return;
    }

    const htmlElement = findCorrespondingHtmlElement(selectedNode);
    const quipSectionType = getQuipSectionType(htmlElement);

    switch (quipSectionType) {
      case QuipSectionType.cell:
        console.log('Found cell');
        const cell = htmlElement.closest('.' + SPREADSHEET_CELL_CLASS)! as HTMLElement;
        const cellTextFromDom = cell.innerText;

        // Open cell editor.
        simulateDoubleClick(htmlElement);

        // Wait until cell editor is opened.
        // TODO: Make less brittle and make Adapter async
        await waitMs(100);

        const cellEditor = document.activeElement;
        if (!cellEditor || !cellEditor.classList.contains('spreadsheet-cell-editor')) {
          console.warn('Found no cell editor', htmlElement, cellEditor);
          return;
        }

        // Select all text of cell editor.
        selection!.selectAllChildren(cellEditor);

        // Replace selection in a way that is recognized by Quip.
        document.execCommand('InsertHTML', false, cellTextFromDom);
        cell.innerText = cellTextFromDom;

        // Close cell editor.
        simulateKeyboardEvent(cellEditor, 'keydown', 'Enter', 13);
        break;
      case QuipSectionType.paragraph:
        console.log('Found paragraph');
        break;
      case QuipSectionType.none:
        console.log('Unknown quipSectionType');
        break;
    }
  }
}

enum QuipSectionType {
  cell = 'cell',
  paragraph = 'content',
  none = 'none',
}

function findCorrespondingHtmlElement(node: Node): HTMLElement {
  return node instanceof HTMLElement ? node : node.parentElement!;
}

function simulateDoubleClick(element: HTMLElement) {
  element.dispatchEvent(
    new MouseEvent('dblclick', {
      view: window,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function simulateKeyboardEvent(element: Element, type: string, key: string, keyCode: number) {
  const keyboardEventProps = {
    key: key,
    code: key,
    keyCode: keyCode,
    which: keyCode,
    view: window,
    bubbles: true,
    cancelable: true,
  };
  element.dispatchEvent(new KeyboardEvent(type, keyboardEventProps));
}

const SPREADSHEET_CELL_CLASS = 'spreadsheet-cell';

function getQuipSectionType(el: HTMLElement): QuipSectionType {
  const ancestor = el.closest(`.${SPREADSHEET_CELL_CLASS}, .content`);
  if (!ancestor) {
    return QuipSectionType.none;
  }
  return ancestor.classList.contains(SPREADSHEET_CELL_CLASS) ? QuipSectionType.cell : QuipSectionType.paragraph;
}

export function isQuip(el: Element) {
  return document.location.host.endsWith('.quip.com') && el.classList.contains('document-content');
}
