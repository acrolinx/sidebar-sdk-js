import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";
import editor = CKEDITOR.editor;

export function getCkEditorInstance(id: string): editor {
  return CKEDITOR.instances[id as any];
}

export class CKEditorTestSetup implements AdapterTestSetup {
  name = 'CKEditorAdapter';
  inputFormat = 'HTML';
  editorElement = '<textarea name="editorId" id="editorId" rows="10" cols="40">initial text</textarea>';

  setEditorContent(html: string, done: DoneCallback) {
    getCkEditorInstance('editorId').setData(html, {
      callback: () => {
        done();
      }
    });
  }

  init(done: DoneCallback) {
    CKEDITOR.disableAutoInline = true;
    CKEDITOR.replace('editorId', {customConfig: ''});
    getCkEditorInstance('editorId').on("instanceReady", () => {
      // Timeout is needed for IE
      setTimeout(() => {
        done();
      }, 10);
    });
  }

  remove() {
    getCkEditorInstance('editorId').destroy(true);
    $('#editorId').remove();
  }
}