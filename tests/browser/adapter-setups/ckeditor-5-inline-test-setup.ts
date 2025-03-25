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

import { CKEditor5Adapter } from '../../../src/adapters/ckeditor-5-adapter';
import { AdapterTestSetup } from './adapter-setup';
import InlineEditor from '@ckeditor/ckeditor5-build-inline';

export class CKEditor5InlineTestSetup implements AdapterTestSetup {
  name = 'CKEditor5Adapter-Inline';
  inputFormat = 'HTML';
  editorElement = '<div id="editorId"><p>initial text</p></div>';

  setEditorContent(html: string) {
    this.getCkEditorInstance('editorId').setData(html);
  }

  async init() {
    const editorDiv = document.querySelector('#editorId');
    const editor = await InlineEditor.create(editorDiv as HTMLElement);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (<any>window).editor = editor;
    return new CKEditor5Adapter({ editorId: 'editorId' });
  }

  async remove() {
    await this.getCkEditorInstance('editorId').destroy();
    const editor = document.getElementById('editorId');
    if (editor) {
      editor.remove();
    }
  }

  getSelectedText(): string {
    return window.getSelection()!.toString();
  }

  public getCkEditorInstance(id: string) {
    const editorDiv = document.querySelector('#' + id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (editorDiv as any).ckeditorInstance;
  }
}
