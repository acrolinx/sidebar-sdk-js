import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";

export class ContentEditableTestSetup implements AdapterTestSetup {
  name = 'ContentEditableAdapter';
  inputFormat = 'HTML';
  editorElement = '<div id="editorId" contenteditable="true">initial text</div>';
  inputEventWasTriggered: boolean;

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