import {AdapterTestSetup, DoneCallback, InitAdapterCallback} from "./adapter-test-setup";
import {InputAdapter} from "../../../src/adapters/InputAdapter";

export class InputAdapterTestSetup implements AdapterTestSetup {
  name = 'InputAdapter';
  inputFormat = 'TEXT';
  editorElement = '<textarea id="editorId">initial text</textarea>';
  inputEventWasTriggered: boolean;

  init(done: InitAdapterCallback) {
    const adapter = new InputAdapter({editorId: 'editorId'});
    done(adapter);
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
}