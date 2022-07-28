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

import {Match, MatchWithReplacement} from "@acrolinx/sidebar-interface";
import {AbstractRichtextEditorAdapter} from "./AbstractRichtextEditorAdapter";
import {HasEditorID, ContentExtractionResult} from "./AdapterInterface";

export class CKEditorAdapter extends AbstractRichtextEditorAdapter {
  editorId: string;
  editorVersion = 4;

  constructor(conf: HasEditorID) {
    super(conf);
    this.editorId = conf.editorId;
    if(typeof window["CKEDITOR"] == 'undefined'){
      this.editorVersion = 5;
    }
  }

  getEditor(): CKEDITOR.editor {
    const ckeditor = CKEDITOR.instances[this.editorId as any];
    if (!ckeditor) {
      throw new Error(`Can't find ckeditor with id '${this.editorId}'`);
    }
    return ckeditor;
  }

  getEditorDocument(): Document {
    // for version 4
    if(this.editorVersion == 4){
      return this.getEditor().document.$ as any;
    }
    // for version 5
    return document.querySelector('.ck-content')!.ownerDocument;
  }

  getContent() {
    // for version 4
    if(this.editorVersion == 4){
      return this.getEditor().getData();
    }
    // for version 5
    // TODO: check if .ck-content exists in all types of CKEditors
    return document.querySelector('.ck-content')!.innerHTML;
  }

  extractContentForCheck(): ContentExtractionResult {
    if (this.isInWysiwygMode()) {
      this.currentContentChecking = this.getContent();
      return {content: this.currentContentChecking};
    } else {
      return {error: 'Action is not permitted in Source mode.'};
    }
  }

  selectRanges(checkId: string, matches: Match[]) {
    if (this.isInWysiwygMode()) {
      super.selectRanges(checkId, matches);
    } else {
      window.alert('Action is not permitted in Source mode.');
    }
  }

  getEditorElement(): HTMLElement {
    if(this.editorVersion == 4){
      return this.getEditorDocument().querySelector('body')!;
    }
    // TODO: check if .ck-editor__main exists in all types of CKEditors
    return this.getEditorDocument().querySelector('.ck-editor__main')!;
  }
  replaceRanges(checkId: string, matchesWithReplacementArg: MatchWithReplacement[]) {
    if (this.isInWysiwygMode()) {
      super.replaceRanges(checkId, matchesWithReplacementArg);
    } else {
      window.alert('Action is not permitted in Source mode.');
    }
  }

  isInWysiwygMode() {
    if(this.editorVersion == 4){
      return this.getEditor().mode === 'wysiwyg';
    }
    // TODO: if mode != 'wysiwyg'
    return true;
  }
}
