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

import { ContentEditableAdapter } from '../../../src/adapters/content-editable-adapter';
import { AdapterTestSetup } from './adapter-setup';
import { EDITOR_HEIGHT } from './constants';

export class ContentEditableTestSetup implements AdapterTestSetup {
  name = 'ContentEditableAdapter';
  inputFormat = 'HTML';
  editorElement = `<div id="editorId" style="height: ${EDITOR_HEIGHT}px; overflow-x: scroll; position: relative; font-size: 10px">initial text</div>`;
  inputEventWasTriggered?: boolean;
  beforeInputEventWasTriggered = false;

  init() {
    return Promise.resolve(new ContentEditableAdapter({ editorId: 'editorId' }));
  }

  setEditorContent(html: string) {
    const editor = document.getElementById('editorId');
    console.log('editor', editor);
    if (editor) {
      editor.innerHTML = html;

      editor.addEventListener('input', () => {
        this.inputEventWasTriggered = true;
      });
      editor.addEventListener('beforeinput', () => {
        this.beforeInputEventWasTriggered = true;
      });
    }
  }

  remove() {
    const editor = document.getElementById('editorId');
    if (editor) {
      editor.remove();
    }
  }

  getSelectedText() {
    return window.getSelection()!.toString();
  }
}
