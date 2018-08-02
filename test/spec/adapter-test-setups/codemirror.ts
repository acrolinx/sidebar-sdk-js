import {EditorFromTextArea} from "codemirror";
import {CodeMirrorAdapter} from "../../../src/adapters/CodeMirrorAdapter";
import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";


export interface CodeMirrorTestSetupOpts {
  mode: string;
  name: string;
  inputFormat: string;
}

export class CodeMirrorTestSetup implements AdapterTestSetup {
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

  init() {
    const editor = CodeMirror.fromTextArea(document.getElementById('editorId') as HTMLTextAreaElement, {
      lineNumbers: true,
      mode: this.mode
    });
    this.editor = editor;
    return Promise.resolve(new CodeMirrorAdapter({editor: editor}));
  }

  setEditorContent(content: string, done: DoneCallback) {
    this.editor.setValue(content);
    done();
  }

  remove() {
    this.editor.toTextArea();
    $('#editorId').remove();
  }

  getSelectedText(): string {
    return window.getSelection().toString();
  }
}