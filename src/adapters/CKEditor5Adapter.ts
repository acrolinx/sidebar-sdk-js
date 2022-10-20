/*
 * Copyright 2022-present Acrolinx GmbH
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

import { Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { AbstractRichtextEditorAdapter } from './AbstractRichtextEditorAdapter';
import { HasEditorID, ContentExtractionResult, AsyncAdapterInterface } from './AdapterInterface';
import InlineEditor from '@ckeditor/ckeditor5-build-inline';
import BalloonEditor from '@ckeditor/ckeditor5-build-balloon';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export class CKEditor5Adapter extends AbstractRichtextEditorAdapter implements AsyncAdapterInterface {
  editorId: string;

  constructor(conf: HasEditorID) {
    super(conf);
    this.editorId = conf.editorId;
  }

  readonly isAsync: true = true;
  readonly requiresSynchronization: true = true;

  getFormat?(): string {
    return 'auto';
  }

  getEditor(): InlineEditor | BalloonEditor | ClassicEditor {
    let editorDomElement = document.querySelector('#' + this.editorId)!;

    const isInlineEditor = editorDomElement.classList.contains('ck-editor__editable');
    if (!isInlineEditor) {
      editorDomElement = editorDomElement.nextElementSibling!.querySelector('.ck-editor__editable')!;
    }

    return (editorDomElement as any).ckeditorInstance as InlineEditor;
  }

  getEditorDocument(): Document {
    return this.getEditorElement().ownerDocument;
  }

  getContent() {
    return this.getEditor().getData();
  }

  extractContentForCheck(): ContentExtractionResult {
    if (!this.isInSourceEditingMode()) {
      this.currentContentChecking = this.getContent();
      return { content: this.currentContentChecking };
    } else {
      return { error: 'Action is not permitted in Source mode.' };
    }
  }

  async selectRanges(checkId: string, matches: Match[]) {
    if (!this.isInSourceEditingMode()) {
      this.removeExistingSelection();
      super.selectRanges(checkId, matches);
    } else {
      window.alert('Action is not permitted in Source mode.');
    }
  }

  getEditorElement(): HTMLElement {
    const editableElement = this.getEditor().ui.getEditableElement();
    if (editableElement) {
      return editableElement;
    }
    throw new Error('Unable to fetch editable element');
  }

  async replaceRanges(checkId: string, matchesWithReplacementArg: MatchWithReplacement[]) {
    if (!this.isInSourceEditingMode()) {
      matchesWithReplacementArg.reverse();
      for (const match of matchesWithReplacementArg) {
        await this.replaceEachMatch(checkId, match);
      }
    } else {
      window.alert('Action is not permitted in Source mode.');
    }
  }

  async replaceEachMatch(checkId: string, match: MatchWithReplacement) {
    await this.selectRanges(checkId, [match]);

    const editor = this.getEditor();

    await new Promise<void>((resolve) => {
      editor.model.document.selection.once('change', (..._args) => {
        resolve();
      });
    });

    editor.model.change((writer) => {
      const selectedRange = editor.model.document.selection.getFirstRange();
      if (selectedRange && selectedRange.end.offset > selectedRange.start.offset) {
        editor.model.insertContent(writer.createText(match.replacement), selectedRange);
      }
    });
  }

  isInSourceEditingMode() {
    const sourceEditingPluginId = 'SourceEditing';
    const editor = this.getEditor();
    if (!editor.plugins.has(sourceEditingPluginId)) {
      return false;
    }
    const sep = editor.plugins.get(sourceEditingPluginId);
    return sep.isEnabled && sep.isSourceEditingMode;
  }

  removeExistingSelection() {
    const editor = this.getEditor();
    editor.model.change((writer) => {
      const startPosition = writer.createPositionFromPath(editor.model.document.getRoot()!, [0]);
      const endPosition = writer.createPositionFromPath(editor.model.document.getRoot()!, [0]);
      const range = writer.createRange(startPosition, endPosition);
      writer.setSelection(range);
    });
  }
}
