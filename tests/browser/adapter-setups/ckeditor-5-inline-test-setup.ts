import { CKEditor5Adapter } from '../../../src/adapters/ckeditor-5-adapter';
import { AdapterTestSetup } from './adapter-setup';
import InlineEditor from '@ckeditor/ckeditor5-build-inline';

export class CKEditor5InlineTestSetup implements AdapterTestSetup {
  name = 'CKEditor5Adapter-Inline';
  inputFormat = 'HTML';
  editorElement = '<div id="editorId"><p>initial text</p></div>';

  setEditorContent(html: string) {
    this.getCkEditorInstance('editorId').setData(html);
  }

  async init() {
    const editorDiv = document.querySelector('#editorId');
    const editor = await InlineEditor.create(editorDiv as HTMLElement);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (<any>window).editor = editor;
    return new CKEditor5Adapter({ editorId: 'editorId' });
  }

  async remove() {
    await this.getCkEditorInstance('editorId').destroy();
    const editor = document.getElementById('editorId');
    if (editor) {
      editor.remove();
    }
  }

  getSelectedText(): string {
    return window.getSelection()!.toString();
  }

  public getCkEditorInstance(id: string) {
    const editorDiv = document.querySelector('#' + id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (editorDiv as any).ckeditorInstance;
  }
}
