import {InputAdapter} from "../../../src/adapters/InputAdapter";
import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";

export class InputAdapterTestSetup implements AdapterTestSetup {
  name = 'InputAdapter';
  inputFormat = 'TEXT';
  editorElement = '<textarea id="editorId">initial text</textarea>';
  inputEventWasTriggered: boolean;

  init() {
    return Promise.resolve(new InputAdapter({editorId: 'editorId'}));
  }

  setEditorContent(content: string, done: DoneCallback) {
    $('#editorId').val(content).on('input', () => {
      this.inputEventWasTriggered = true;
    });
    done();
  }

  remove() {
    $('#editorId').remove();
  }

  getSelectedText(): string {
    return window.getSelection().toString();
  }
}