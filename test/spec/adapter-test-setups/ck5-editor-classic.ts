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

import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";
import {CKEditor5Adapter} from "../../../src/adapters/CKEditor5Adapter";
import * as CKEDITOR from '@abhijeetnarvekar/ckeditor5-build-super';

export class CKEditor5ClassicTestSetup implements AdapterTestSetup {
  name = 'CKEditor5Adapter-Classic';
  inputFormat = 'HTML';
  editorElement = '<div id="editorId"><p>initial text</p></div>';
  editorInstance: any;

  setEditorContent(html: string, done: DoneCallback) {
    this.getCkEditorInstance('editorId').setData(html);
    done();
  }

  async init() {
    const editorDiv = document.querySelector('#editorId');
    const editor = await CKEDITOR.ClassicEditor.create(editorDiv as HTMLElement);
    (<any>window).editor = editor; 
    return new CKEditor5Adapter({editorId: "editorId"});
  }

  async remove() {
    await this.getCkEditorInstance('editorId').destroy();
    $('#editorId').remove();
  }

  getSelectedText(): string {
    return window.getSelection()!.toString();
  }

  public getCkEditorInstance(id: string) {
    let editorDomElement = document.querySelector('#' + id);
    editorDomElement = editorDomElement!.nextElementSibling!.querySelector('.ck-editor__editable')!
    return (editorDomElement as any).ckeditorInstance;
  }

}
