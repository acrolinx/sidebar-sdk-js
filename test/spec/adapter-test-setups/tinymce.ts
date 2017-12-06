import {AdapterTestSetup, DoneCallback} from "./adapter-test-setup";
import editor = CKEDITOR.editor;

export function getCkEditorInstance(id: string): editor {
  return CKEDITOR.instances[id as any];
}

export class TinyMCETestSetup implements AdapterTestSetup {
  name = 'TinyMCEAdapter';
  inputFormat = 'HTML';
  editorElement = '<textarea id="editorId" rows="10" cols="40">initial text</textarea>initial text</textarea>';

  setEditorContent(html: string, done: DoneCallback) {
    tinymce.get("editorId").setContent(html);
    done();
  }

  init(done: DoneCallback) {
    tinymce.init({
      selector: "#editorId",
      height: 50,
      init_instance_callback: () => {
        done();
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