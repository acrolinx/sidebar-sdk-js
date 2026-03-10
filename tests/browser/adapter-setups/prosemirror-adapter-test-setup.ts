/*
 * Copyright 2026-present Markup AI, Inc.
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

import { ProseMirrorAdapter } from '../../../src/adapters/ProseMirrorAdapter';
import { AdapterTestSetup } from './adapter-setup';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { schema } from 'prosemirror-schema-basic';

export interface ProseMirrorTestSetupOpts {
  name: string;
  inputFormat: string;
}

function createDocFromText(text: string) {
  return schema.nodeFromJSON({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: text ? [{ type: 'text', text }] : [],
      },
    ],
  });
}

export class ProseMirrorTestSetup implements AdapterTestSetup {
  name: string;
  inputFormat: string;
  editorElement = '<div id="prosemirror-editor"></div>';
  editor!: EditorView;
  private container!: HTMLElement;

  constructor(opts: ProseMirrorTestSetupOpts) {
    this.name = opts.name;
    this.inputFormat = opts.inputFormat;
  }

  init() {
    const container = document.getElementById('prosemirror-editor') as HTMLElement;
    this.container = container;
    const state = EditorState.create({
      schema,
      doc: createDocFromText('initial text'),
    });
    const view = new EditorView(container, { state });
    this.editor = view;
    return Promise.resolve(new ProseMirrorAdapter({ editor: view, format: this.inputFormat }));
  }

  setEditorContent(content: string) {
    const doc = createDocFromText(content);
    const state = EditorState.create({ schema, doc });
    this.editor.updateState(state);
  }

  remove() {
    this.editor.destroy();
    this.container.remove();
  }

  getSelectedText(): string {
    const { state } = this.editor;
    const { from, to } = state.selection;
    return state.doc.textBetween(from, to);
  }
}
