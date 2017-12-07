import {AdapterTestSetup, DoneCallback, InitAdapterCallback} from "./adapter-test-setup";
import {CodeMirrorAdapter} from "../../../src/adapters/CodeMirrorAdapter";
import {EditorFromTextArea} from "codemirror";


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
  editor: EditorFromTextArea;

  constructor(opts: CodeMirrorTestSetupOpts) {
    this.name = opts.name;
    this.inputFormat = opts.inputFormat;
    this.mode = opts.mode;
  }

  init(done: InitAdapterCallback) {
    const editor = CodeMirror.fromTextArea(document.getElementById('editorId') as HTMLTextAreaElement, {
      lineNumbers: true,
      mode: this.mode
    });
    this.editor = editor;
    const adapter = new CodeMirrorAdapter({editor: editor});
    done(adapter);
  }

  setEditorContent(content: string, done: DoneCallback) {
    this.editor.setValue(content);
    done();
  }

  remove() {
    this.editor.toTextArea();
    $('#editorId').remove();
  }
}