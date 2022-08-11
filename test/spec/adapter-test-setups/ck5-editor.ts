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

import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";
import {CKEditor5Adapter} from "../../../src/adapters/CKEditor5Adapter";
import InlineEditor from '@ckeditor/ckeditor5-build-inline';

export function getCkEditorInstance(id: string): InlineEditor {
  const editorDiv = document.querySelector('#' + id);
  return (editorDiv as any).ckeditorInstance;
}

export class CKEditor5TestSetup implements AdapterTestSetup {
  name = 'CKEditor5Adapter';
  inputFormat = 'HTML';
  editorElement = '<div id="editorId"><p>initial text</p></div>';

  setEditorContent(html: string, done: DoneCallback) {
    getCkEditorInstance('editorId').setData(html);
    done();
  }

  async init() {
    const editorDiv = document.querySelector('#editorId');
    const editor = await InlineEditor.create(editorDiv as HTMLElement);
    (<any>window).editor = editor; 
    return new CKEditor5Adapter({editorId: "editorId"});
  }

  async remove() {
    await getCkEditorInstance('editorId').destroy();
    $('#editorId').remove();
  }

  getSelectedText(): string {
    return window.getSelection()!.toString();
  }

}
