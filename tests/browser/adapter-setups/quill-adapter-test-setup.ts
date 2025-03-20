import Quill from 'quill';
import { AdapterTestSetup } from './adapter-setup';
import { EDITOR_HEIGHT } from './constants';
import { ContentEditableAdapter } from '../../../src/adapters/content-editable-adapter';

export class QuillContentEditableTestSetup implements AdapterTestSetup {
  name = 'QuillContentEditableAdapter';
  inputFormat = 'HTML';
  editorElement = `<div id="editorId" style="height: ${EDITOR_HEIGHT}px">initial text</div>`;
  quill!: Quill;

  async init() {
    this.quill = new Quill('#editorId', { theme: 'snow', bounds: 'editorId' });
    const quillElement = document.querySelector<HTMLDivElement>('#editorId .ql-editor')!;
    return Promise.resolve(new ContentEditableAdapter({ element: quillElement }));
  }

  setEditorContent(html: string) {
    // https://github.com/quilljs/quill/issues/1449
    this.quill.clipboard.dangerouslyPasteHTML(html);
  }

  remove() {
    const editor = document.getElementById('editorId');
    if (editor) {
      editor.remove();
    }
    const toolbar = document.getElementsByClassName('ql-toolbar')[0];
    if (toolbar) {
      toolbar.remove();
    }
  }

  getSelectedText(): string {
    return window.getSelection()!.toString();
  }
}
