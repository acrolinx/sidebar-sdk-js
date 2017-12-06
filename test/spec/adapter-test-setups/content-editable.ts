import {AdapterTestSetup, DoneCallback, InitAdapterCallback} from "./adapter-test-setup";
import {ContentEditableAdapter} from "../../../src/adapters/ContentEditableAdapter";

export class ContentEditableTestSetup implements AdapterTestSetup {
  name = 'ContentEditableAdapter';
  inputFormat = 'HTML';
  editorElement = '<div id="editorId" contenteditable="true">initial text</div>';
  inputEventWasTriggered: boolean;

  init(done: InitAdapterCallback) {
    const adapter = new ContentEditableAdapter({editorId: 'editorId'});
    done(adapter);
  }

  setEditorContent(html: string, done: DoneCallback) {
    $('#editorId').html(html).on('input', () => {
      this.inputEventWasTriggered = true;
    });
    done();
  }

  remove() {
    $('#editorId').remove();
  }
}