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

import {AdapterInterface} from "../../../src/adapters/AdapterInterface";
import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";
import {CKEditorAdapter} from "../../../src/adapters/CKEditorAdapter";
import {waitMs} from '../../utils/test-utils';
import editor = CKEDITOR.editor;

export function getCkEditorInstance(id: string): editor {
  return CKEDITOR.instances[id as any]!;
}

export class CKEditorTestSetup implements AdapterTestSetup {
  name = 'CKEditorAdapter';
  inputFormat = 'HTML';
  editorElement = '<textarea name="editorId" id="editorId" rows="10" cols="40">initial text</textarea>';

  setEditorContent(html: string, done: DoneCallback) {
    getCkEditorInstance('editorId').setData(html, {
      callback: () => {
        done();
      }
    });
  }

  async init() {
    return new Promise<AdapterInterface>(async (resolve, reject) => {
      const adapter = new CKEditorAdapter({editorId: 'editorId'});
      CKEDITOR.disableAutoInline = true;
      CKEDITOR.replace('editorId', {customConfig: ''});
      getCkEditorInstance('editorId').on("instanceReady", () => {
        // Timeout is needed for IE
        setTimeout(() => {
          resolve(adapter);
        }, 30);
      });
      waitMs(5000).then(() => reject('Instance ready was never called by CK Editor.')).catch(() => {
        reject();
      });
    });
  }

  remove() {
    getCkEditorInstance('editorId').destroy(true);
    $('#editorId').remove();
  }

  getSelectedText(): string {
    return getCkEditorInstance('editorId').getSelection().getSelectedText();
  }
}
