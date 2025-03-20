import { CodeMirror6Adapter } from '../../../src/adapters/codemirror-6-adapter';
import { AdapterTestSetup } from './adapter-setup';
import { EditorView } from '@codemirror/view';

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

  setEditorContent(content: string) {
    this.editor.dispatch({
      changes: { from: 0, to: this.editor.state.doc.length, insert: content },
    });
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
