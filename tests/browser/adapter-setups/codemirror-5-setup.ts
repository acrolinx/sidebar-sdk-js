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

import CodeMirror, { EditorFromTextArea } from 'codemirror';
import { CodeMirrorAdapter } from '../../../src/adapters/codemirror-5-adapter';
import { AdapterTestSetup } from './adapter-setup';

export interface CodeMirrorTestSetupOpts {
  mode: string;
  name: string;
  inputFormat: string;
}

export class CodeMirror5TestSetup implements AdapterTestSetup {
  name: string;
  inputFormat: string;
  mode: string;
  editorElement = '<textarea id="editorId">initial text</textarea>';
  editor!: EditorFromTextArea;

  constructor(opts: CodeMirrorTestSetupOpts) {
    this.name = opts.name;
    this.inputFormat = opts.inputFormat;
    this.mode = opts.mode;
  }

  async init() {
    const editor = CodeMirror.fromTextArea(document.getElementById('editorId') as HTMLTextAreaElement, {
      lineNumbers: true,
      mode: this.mode,
    });
    this.editor = editor;
    return Promise.resolve(new CodeMirrorAdapter({ editor: editor }));
  }

  setEditorContent(content: string) {
    this.editor.setValue(content);
  }

  remove() {
    this.editor.toTextArea();
    document.querySelector('#editorId')!.remove();
  }

  getSelectedText(): string {
    return this.editor.getDoc().getSelection();
  }
}
