import {AdapterInterface} from "../../../src/adapters/AdapterInterface";
import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";
import {TinyMCEAdapter} from "../../../src/adapters/TinyMCEAdapter";

export class TinyMCETestSetup implements AdapterTestSetup {
  name = 'TinyMCEAdapter';
  inputFormat = 'HTML';
  editorElement = '<textarea id="editorId" rows="10" cols="40">initial text</textarea>';

  setEditorContent(html: string, done: DoneCallback) {
    tinymce.get("editorId").setContent(html);
    done();
  }

  init() {
    return new Promise<AdapterInterface>((resolve, reject) => {
      tinymce.init({
        selector: "#editorId",
        height: 50,
        init_instance_callback: () => {
          resolve(new TinyMCEAdapter({editorId: 'editorId'}));
        }
      }).catch(reject);
    });
  }

  remove() {
    if (tinymce) {
      tinymce.get('editorId').remove();
    }
    $('#editorId').remove();
  }

  getSelectedText(): string {
    return tinymce.get("editorId").selection.getContent();
  }
}