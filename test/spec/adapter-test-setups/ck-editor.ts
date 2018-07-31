import {AdapterInterface} from "../../../src/adapters/AdapterInterface";
import {waitMs} from "../../utils/test-utils";
import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";
import editor = CKEDITOR.editor;
import {CKEditorAdapter} from "../../../src/adapters/CKEditorAdapter";

export function getCkEditorInstance(id: string): editor {
  return CKEDITOR.instances[id as any]!;
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

  async init() {
    const adapter = new CKEditorAdapter({editorId: 'editorId'});
    CKEDITOR.disableAutoInline = true;
    CKEDITOR.replace('editorId', {customConfig: ''});
    await waitMs(30);
    return new Promise<AdapterInterface>(async (resolve) => {
      getCkEditorInstance('editorId').on("instanceReady", () => {
        // Timeout is needed for IE
        setTimeout(() => {
          resolve(adapter);
        }, 30);
      });
    });
  }

  remove() {
    getCkEditorInstance('editorId').destroy(true);
    $('#editorId').remove();
  }

  getSelectedText(): string {
    return getCkEditorInstance('editorId').getSelection().getSelectedText();
  }
}