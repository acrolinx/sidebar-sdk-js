import {AdapterTestSetup, DoneCallback, InitAdapterCallback} from "./adapter-test-setup";
import editor = CKEDITOR.editor;
import {TinyMCEAdapter} from "../../../src/adapters/TinyMCEAdapter";

export function getCkEditorInstance(id: string): editor {
  return CKEDITOR.instances[id as any];
}

export class TinyMCETestSetup implements AdapterTestSetup {
  name = 'TinyMCEAdapter';
  inputFormat = 'HTML';
  editorElement = '<textarea id="editorId" rows="10" cols="40">initial text</textarea>';

  setEditorContent(html: string, done: DoneCallback) {
    tinymce.get("editorId").setContent(html);
    done();
  }

  init(done: InitAdapterCallback) {
    tinymce.init({
      selector: "#editorId",
      height: 50,
      init_instance_callback: () => {
        done(new TinyMCEAdapter({editorId: 'editorId'}));
      }
    });
  }

  remove() {
    if (tinymce) {
      tinymce.get('editorId').remove();
    }
    $('#editorId').remove();
  }
}