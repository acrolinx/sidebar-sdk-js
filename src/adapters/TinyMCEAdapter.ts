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

import {Editor} from 'tinymce';
import {DocumentSelection} from '../acrolinx-libs/plugin-interfaces';
import {getSelectionHtmlRanges} from '../utils/check-selection';
import {AbstractRichtextEditorAdapter, removeEmptyTextNodesIfNeeded} from './AbstractRichtextEditorAdapter';
import {ExtractContentForCheckOpts, HasEditorID} from './AdapterInterface';

export class TinyMCEAdapter extends AbstractRichtextEditorAdapter {
  editorId: string;

  constructor(conf: HasEditorID) {
    super(conf);
    this.editorId = conf.editorId;
  }

  getEditor(): Editor {
    return tinymce.get(this.editorId);
  }

  getContent(opts: ExtractContentForCheckOpts) {
    if (opts.checkSelection) {
      return this.getContentForCheckSelection(this.getEditorElement());
    } else {
      return this.getEditor().getContent({});
    }
  }

  getContentForCheckSelection = (el: HTMLElement) =>
    this.getEditor().serializer.serialize(el, {}) as unknown as string

  protected getSelection(): DocumentSelection {
    return {ranges: getSelectionHtmlRanges(this.getEditorElement(), this.getContentForCheckSelection)};
  }

  getEditorDocument() {
    return this.getEditor().getDoc();
  }

  scrollToCurrentSelection() {
    const selection = this.getEditorDocument().getSelection();
    if (selection) {
      try {
        const originalRange = selection.getRangeAt(0);
        const {startContainer, startOffset, endContainer, endOffset} = originalRange;
        selection.collapseToStart();

        // TODO: Does this line cause a failing selection in IE11 sometimes?
        (this.getEditor() as any).insertContent('');

        const restoredRange = this.getEditorDocument().createRange();
        restoredRange.setStart(startContainer, startOffset);
        restoredRange.setEnd(endContainer, endOffset);

        selection.removeAllRanges();
        selection.addRange(restoredRange);

        removeEmptyTextNodesIfNeeded(originalRange);
      } catch (error) {
        console.log('Scrolling Error: ', error);
      }
    }
  }
}
