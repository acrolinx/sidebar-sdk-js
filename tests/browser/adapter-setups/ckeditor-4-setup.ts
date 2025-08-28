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

import { CKEditor4Adapter } from '../../../src/adapters/CKEditor4Adapter';
import { AdapterTestSetup } from './adapter-setup';

export function getCkEditorInstance(id: string): CKEDITOR.editor {
  return CKEDITOR.instances[id]!;
}

export class CKEditor4TestSetup implements AdapterTestSetup {
  name = 'CKEditorAdapter';
  inputFormat = 'HTML';
  editorElement = '<textarea name="editorId" id="editorId" rows="10" cols="40">initial text</textarea>';

  async setEditorContent(html: string): Promise<void> {
    return new Promise<void>((resolve) => {
      getCkEditorInstance('editorId').setData(html, {
        callback: () => {
          resolve();
        },
      });
    });
  }

  async init() {
    // Load CKEditor from CDN dynamically.
    const script = document.createElement('script');
    script.src = '/node_modules/ckeditor4/ckeditor.js';
    document.head.appendChild(script);

    return new Promise<CKEditor4Adapter>((resolve) => {
      script.onload = async () => {
        const adapter = new CKEditor4Adapter({ editorId: 'editorId' });
        CKEDITOR.editorConfig = function (config) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (config as any).versionCheck = false;
        };
        CKEDITOR.disableAutoInline = true;
        CKEDITOR.replace('editorId', {
          versionCheck: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        await this.waitForEditor();
        resolve(adapter);
      };
    });
  }

  remove() {
    getCkEditorInstance('editorId').destroy(true);
    const editor = document.getElementById('editorId');
    if (editor) {
      editor.remove();
    }
  }

  waitForEditor = async (): Promise<CKEDITOR.editor> => {
    return new Promise((resolve) => {
      const editor = CKEDITOR.instances.editorId;
      if (editor && editor.status === 'ready') {
        resolve(editor);
      } else {
        const interval = setInterval(() => {
          const checkEditor = CKEDITOR.instances.editorId;
          console.log('ckeditor 4', checkEditor, checkEditor.status);
          if (checkEditor && checkEditor.status === 'ready') {
            clearInterval(interval);
            resolve(checkEditor);
          }
        }, 100);
      }
    });
  };

  getSelectedText(): string {
    return getCkEditorInstance('editorId').getSelection().getSelectedText();
  }
}
