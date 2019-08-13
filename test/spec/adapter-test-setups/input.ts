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

import {InputAdapter} from "../../../src/adapters/InputAdapter";
import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";

export class InputAdapterTestSetup implements AdapterTestSetup {
  name = 'InputAdapter';
  inputFormat = 'TEXT';
  editorElement = '<textarea id="editorId">initial text</textarea>';
  inputEventWasTriggered = false;

  init() {
    return Promise.resolve(new InputAdapter({editorId: 'editorId'}));
  }

  setEditorContent(content: string, done: DoneCallback) {
    $('#editorId').val(content).on('input', () => {
      this.inputEventWasTriggered = true;
    });
    done();
  }

  remove() {
    $('#editorId').remove();
  }

  getSelectedText(): string {
    const textarea = document.querySelector<HTMLTextAreaElement>('#editorId')!;
    return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
  }
}
