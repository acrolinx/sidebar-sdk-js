import { Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { AbstractRichtextEditorAdapter } from './abstract-rich-text-editor-adapter';
import { HasEditorID, ContentExtractionResult } from './adapter-interface';
import InlineEditor from '@ckeditor/ckeditor5-build-inline';
import { SourceEditing } from '@ckeditor/ckeditor5-source-editing';

export class CKEditor5Adapter extends AbstractRichtextEditorAdapter {
  editorId: string;

  constructor(conf: HasEditorID) {
    super(conf);
    this.editorId = conf.editorId;
  }

  getEditor(): InlineEditor {
    let editorDomElement = document.querySelector('#' + this.editorId)!;

    const isInlineEditor = editorDomElement.classList.contains('ck-editor__editable');
    if (!isInlineEditor) {
      editorDomElement = editorDomElement.nextElementSibling!.querySelector('.ck-editor__editable')!;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (editorDomElement as any).ckeditorInstance as InlineEditor;
  }

  getEditorDocument(): Document {
    return this.getEditorElement().ownerDocument;
  }

  getContent() {
    return this.getEditor().getData();
  }

  extractContentForCheck(): ContentExtractionResult {
    if (!this.isInSourceEditingMode()) {
      this.currentContentChecking = this.getContent();
      return { content: this.currentContentChecking };
    } else {
      return { error: 'Action is not permitted in Source mode.' };
    }
  }

  selectRanges(checkId: string, matches: Match[]) {
    if (!this.isInSourceEditingMode()) {
      super.selectRanges(checkId, matches);
    } else {
      window.alert('Action is not permitted in Source mode.');
    }
  }

  getEditorElement(): HTMLElement {
    const editableElement = this.getEditor().ui.getEditableElement();
    if (editableElement) {
      return editableElement;
    }
    throw new Error('Unable to fetch editable element');
  }

  replaceRanges(checkId: string, matchesWithReplacementArg: MatchWithReplacement[]) {
    if (!this.isInSourceEditingMode()) {
      super.replaceRanges(checkId, matchesWithReplacementArg);
    } else {
      window.alert('Action is not permitted in Source mode.');
    }
  }

  isInSourceEditingMode() {
    const sourceEditingPluginId = 'SourceEditing';
    const editor = this.getEditor();
    if (!editor.plugins.has(sourceEditingPluginId)) {
      return false;
    }
    const sep: SourceEditing = editor.plugins.get(sourceEditingPluginId);
    return sep.isEnabled && sep.isSourceEditingMode;
  }
}
