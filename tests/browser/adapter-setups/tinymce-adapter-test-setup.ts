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

import { TinyMCEAdapter } from '../../../src/adapters/tinymce-adapter';
import { AdapterTestSetup } from './adapter-setup';

/* Import TinyMCE  All imports are needed. See https://www.tiny.cloud/docs/tinymce/latest/vite-es6-npm/ */
import tinymce from 'tinymce';
import 'tinymce/icons/default/icons.min.js';
import 'tinymce/themes/silver/theme.min.js';
import 'tinymce/models/dom/model.min.js';
import 'tinymce/skins/ui/oxide/skin.js';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/code';
import 'tinymce/plugins/emoticons';
import 'tinymce/plugins/emoticons/js/emojis';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/table';

export class TinyMCETestSetup implements AdapterTestSetup {
  name = 'TinyMCEAdapter';
  inputFormat = 'HTML';
  editorElement = '<textarea id="editorId" rows="10" cols="40">initial text</textarea>';

  getTinyMceEditor = () => tinymce.get('editorId');

  setEditorContent(html: string) {
    tinymce.get('editorId')!.setContent(html);
  }

  async init() {
    console.log('init tiny');

    await tinymce.init({
      selector: '#editorId',
      plugins: 'advlist code emoticons link lists table',
      toolbar: 'bold italic | bullist numlist | link emoticons',
      skin_url: 'default',
      content_css: 'default',
      height: 50,
    });
    console.log('init tiny done');
    return new TinyMCEAdapter({ editorId: 'editorId' });
  }

  remove() {
    if (tinymce) {
      tinymce.get('editorId')!.remove();
    }
    const editor = document.getElementById('editorId');
    if (editor) {
      editor.remove();
    }
  }

  getSelectedText(): string {
    return tinymce.get('editorId')!.selection.getContent();
  }
}
