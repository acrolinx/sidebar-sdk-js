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

import Quill from 'quill';
import { AdapterTestSetup } from './adapter-setup';
import { EDITOR_HEIGHT } from './constants';
import { ContentEditableAdapter } from '../../../src/adapters/content-editable-adapter';

export class QuillContentEditableTestSetup implements AdapterTestSetup {
  name = 'QuillContentEditableAdapter';
  inputFormat = 'HTML';
  editorElement = `<div id="editorId" style="height: ${EDITOR_HEIGHT}px">initial text</div>`;
  quill!: Quill;

  async init() {
    this.quill = new Quill('#editorId', { theme: 'snow', bounds: 'editorId' });
    const quillElement = document.querySelector<HTMLDivElement>('#editorId .ql-editor')!;
    return Promise.resolve(new ContentEditableAdapter({ element: quillElement }));
  }

  setEditorContent(html: string) {
    // https://github.com/quilljs/quill/issues/1449
    this.quill.clipboard.dangerouslyPasteHTML(html);
  }

  remove() {
    const editor = document.getElementById('editorId');
    if (editor) {
      editor.remove();
    }
    const toolbar = document.getElementsByClassName('ql-toolbar')[0];
    if (toolbar) {
      toolbar.remove();
    }
  }

  getSelectedText(): string {
    return window.getSelection()!.toString();
  }
}
