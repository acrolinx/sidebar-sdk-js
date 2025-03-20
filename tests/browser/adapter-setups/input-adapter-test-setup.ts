import { InputAdapter } from '../../../src/adapters/input-adapter';
import { AdapterTestSetup } from './adapter-setup';

export class InputAdapterTestSetup implements AdapterTestSetup {
  name = 'InputAdapter';
  inputFormat = 'TEXT';
  editorElement = `<textarea id="editorId">initial text</textarea>`;
  inputEventWasTriggered = false;

  init() {
    return Promise.resolve(new InputAdapter({ editorId: 'editorId' }));
  }

  setEditorContent(html: string) {
    const editor = document.getElementById('editorId');
    if (editor) {
      (editor as HTMLInputElement).value = html;

      editor.addEventListener('input', () => {
        this.inputEventWasTriggered = true;
      });
    }
  }

  remove() {
    const editor = document.getElementById('editorId');
    if (editor) {
      editor.remove();
    }
  }

  getSelectedText() {
    const textarea = document.querySelector<HTMLTextAreaElement>('#editorId')!;
    return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
  }
}
