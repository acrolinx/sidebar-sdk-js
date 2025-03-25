/*
 * Copyright 2017-present Acrolinx GmbH
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

import { CKEditorAdapter } from '../../../src/adapters/ckeditor-4-adapter';
import { AdapterTestSetup } from './adapter-setup';
import '../../../node_modules/ckeditor4/ckeditor.js';
import editor = CKEDITOR.editor;
import { waitMs } from '../utils/test-utils.js';

export function getCkEditorInstance(id: string): editor {
  return CKEDITOR.instances[id]!;
}

export class CKEditor4TestSetup implements AdapterTestSetup {
  name = 'CKEditorAdapter';
  inputFormat = 'HTML';
  editorElement = '<textarea name="editorId" id="editorId" rows="10" cols="40">initial text</textarea>';

  setEditorContent(html: string) {
    getCkEditorInstance('editorId').setData(html);
  }

  async init() {
    const adapter = new CKEditorAdapter({ editorId: 'editorId' });
    CKEDITOR.disableAutoInline = true;
    CKEDITOR.replace('editorId', { customConfig: '' });
    await waitMs(10);
    return adapter;
  }

  remove() {
    getCkEditorInstance('editorId').destroy(true);
    const editor = document.getElementById('editorId');
    if (editor) {
      editor.remove();
    }
  }

  getSelectedText(): string {
    return getCkEditorInstance('editorId').getSelection().getSelectedText();
  }
}
