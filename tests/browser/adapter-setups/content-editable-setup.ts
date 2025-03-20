import { ContentEditableAdapter } from '../../../src/adapters/content-editable-adapter';
import { AdapterTestSetup } from './adapter-setup';
import { EDITOR_HEIGHT } from './constants';

export class ContentEditableTestSetup implements AdapterTestSetup {
  name = 'ContentEditableAdapter';
  inputFormat = 'HTML';
  editorElement = `<div id="editorId" style="height: ${EDITOR_HEIGHT}px; overflow-x: scroll; position: relative; font-size: 10px">initial text</div>`;
  inputEventWasTriggered?: boolean;
  beforeInputEventWasTriggered = false;

  init() {
    return Promise.resolve(new ContentEditableAdapter({ editorId: 'editorId' }));
  }

  setEditorContent(html: string) {
    console.log('callback called');
    const editor = document.getElementById('editorId');
    console.log('editor', editor);
    if (editor) {
      editor.innerHTML = html;

      editor.addEventListener('input', () => {
        this.inputEventWasTriggered = true;
      });
      editor.addEventListener('beforeinput', () => {
        this.beforeInputEventWasTriggered = true;
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
    return window.getSelection()!.toString();
  }
}
