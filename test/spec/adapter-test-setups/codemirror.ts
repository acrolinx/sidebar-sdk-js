import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";

export class CodeMirrorTestSetup implements AdapterTestSetup {
  name = 'CodeMirrorAdapter';
  inputFormat = 'TEXT';
  editorElement = '<textarea id="editorId">initial text</textarea>';
  editor: CodeMirror.EditorFromTextArea;

  createAdapterConf() {
    this.editor = CodeMirror.fromTextArea(document.getElementById('editorId') as HTMLTextAreaElement, {
      lineNumbers: true,
      mode: 'text/plain'
    });
    return {
      editor: this.editor
    };
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