import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";

export class InputAdapterTestSetup implements AdapterTestSetup {
  name = 'InputAdapter';
  inputFormat = 'TEXT';
  editorElement = '<textarea id="editorId">initial text</textarea>';
  inputEventWasTriggered: boolean;

  setEditorContent(content: string, done: DoneCallback) {
    $('#editorId').val(content).on('input', () => {
      this.inputEventWasTriggered = true;
    });
    done();
  }

  remove() {
    $('#editorId').remove();
  }
}