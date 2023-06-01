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

import { AdapterTestSetup, DoneCallback } from './adapter-test-setup';
import { EditorView } from '@codemirror/view';
import { CodeMirror6Adapter } from '../../../src/adapters/CodeMirror6Adapter';

export interface CodeMirrorTestSetupOpts {
  mode: string;
  name: string;
  inputFormat: string;
}

export class CodeMirror6TestSetup implements AdapterTestSetup {
  name: string;
  inputFormat: string;
  mode: string;
  editorElement = '<textarea id="editorId">initial text</textarea>';
  editor!: EditorView;

  constructor(opts: CodeMirrorTestSetupOpts) {
    this.name = opts.name;
    this.inputFormat = opts.inputFormat;
    this.mode = opts.mode;
  }

  init() {
    const editor = new EditorView({
      doc: 'initial text',
    });
    this.editor = editor;
    return Promise.resolve(new CodeMirror6Adapter({ editor: editor, format: this.inputFormat }));
  }

  setEditorContent(content: string, done: DoneCallback) {
    this.editor.dispatch({
      changes: { from: 0, to: this.editor.state.doc.length, insert: content },
    });
    done();
  }

  remove() {
    this.editor.destroy();
    document.querySelector('#editorId')!.remove();
  }

  getSelectedText(): string {
    return this.editor.state
      .sliceDoc(this.editor.state.selection.main.from, this.editor.state.selection.main.to)
      .toString();
  }
}
