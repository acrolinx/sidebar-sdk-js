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

import {Match, MatchWithReplacement} from "@acrolinx/sidebar-interface";
import {AbstractRichtextEditorAdapter} from "./AbstractRichtextEditorAdapter";
import {HasEditorID, ContentExtractionResult} from "./AdapterInterface";
import InlineEditor from '@ckeditor/ckeditor5-build-inline';
import BalloonEditor from "@ckeditor/ckeditor5-build-balloon";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

export class CKEditor5Adapter extends AbstractRichtextEditorAdapter {
  editorId: string;

  constructor(conf: HasEditorID) {
    super(conf);
    this.editorId = conf.editorId;
  }

  getEditor(): InlineEditor | BalloonEditor | ClassicEditor {
    let editorDomElement = document.querySelector('#' + this.editorId)!;

    const isInlineEditor = editorDomElement.classList.contains('ck-editor__editable');
    if(!isInlineEditor){
      editorDomElement = editorDomElement.nextElementSibling!.querySelector('.ck-editor__editable')!;
    }

    return ((editorDomElement as any).ckeditorInstance) as InlineEditor;
  }

  getEditorDocument(): Document {
    return (this.getEditor() as any).ui.getEditableElement().ownerDocument;
  }

  getContent() {
    return this.getEditor().getData();
  }

  extractContentForCheck(): ContentExtractionResult {
    if (this.isInSourceEditingMode()) {
      this.currentContentChecking = this.getContent();
      return {content: this.currentContentChecking};
    } else {
      return {error: 'Action is not permitted in Source mode.'};
    }
  }

  selectRanges(checkId: string, matches: Match[]) {
    if (this.isInSourceEditingMode()) {
      super.selectRanges(checkId, matches);
    } else {
      window.alert('Action is not permitted in Source mode.');
    }
  }

  getEditorElement(): HTMLElement {
    return (this.getEditor() as any).ui.getEditableElement();
  }

  replaceRanges(checkId: string, matchesWithReplacementArg: MatchWithReplacement[]) {
    if (this.isInSourceEditingMode()) {
      super.replaceRanges(checkId, matchesWithReplacementArg);
    } else {
      window.alert('Action is not permitted in Source mode.');
    }
  }

  isInSourceEditingMode() {
    const editor = this.getEditor();
    if (!editor.plugins.has('SourceEditing')) {
      return true;
    }
    const sep = editor.plugins.get('SourceEditing') as any;
    return sep.isEnabled && sep.isSourceEditingMode;
    
  }
}
