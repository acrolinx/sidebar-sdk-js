import {AdapterTestSetup, DoneCallback, InitAdapterCallback} from "./adapter-test-setup";
import {CodeMirrorAdapter} from "../../../src/adapters/CodeMirrorAdapter";
import {EditorFromTextArea} from "codemirror";

export class CodeMirrorTestSetup implements AdapterTestSetup {
  name = 'CodeMirrorAdapter';
  inputFormat = 'TEXT';
  editorElement = '<textarea id="editorId">initial text</textarea>';
  editor: EditorFromTextArea;

  init(done: InitAdapterCallback) {
    const editor = CodeMirror.fromTextArea(document.getElementById('editorId') as HTMLTextAreaElement, {
      lineNumbers: true,
      mode: 'text/plain'
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