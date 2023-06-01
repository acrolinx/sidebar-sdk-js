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

import { AdapterInterface } from '../../../src/adapters/AdapterInterface';
import { AdapterTestSetup, DoneCallback } from './adapter-test-setup';
import { TinyMCEAdapter } from '../../../src/adapters/TinyMCEAdapter';

export class TinyMCETestSetup implements AdapterTestSetup {
  name = 'TinyMCEAdapter';
  inputFormat = 'HTML';
  editorElement = '<textarea id="editorId" rows="10" cols="40">initial text</textarea>';

  getTinyMceEditor = () => tinymce.get('editorId');

  setEditorContent(html: string, done: DoneCallback) {
    tinymce.get('editorId')!.setContent(html);
    done();
  }

  init() {
    return new Promise<AdapterInterface>((resolve, reject) => {
      tinymce
        .init({
          selector: '#editorId',
          height: 50,
          init_instance_callback: () => {
            resolve(new TinyMCEAdapter({ editorId: 'editorId' }));
          },
        })
        .catch(reject);
    });
  }

  remove() {
    if (tinymce) {
      tinymce.get('editorId')!.remove();
    }
    $('#editorId').remove();
  }

  getSelectedText(): string {
    return tinymce.get('editorId')!.selection.getContent();
  }
}
