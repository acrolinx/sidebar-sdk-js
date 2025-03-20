import { Editor } from 'tinymce';
import { DocumentSelection } from '@acrolinx/sidebar-interface';
import { getSelectionHtmlRanges } from '../utils/check-selection';
import { AbstractRichtextEditorAdapter } from './abstract-rich-text-editor-adapter';
import { ExtractContentForCheckOpts, HasEditorID } from './adapter-interface';

export class TinyMCEAdapter extends AbstractRichtextEditorAdapter {
  editorId: string;

  constructor(conf: HasEditorID) {
    super(conf);
    this.config.disableInputEventSimulation = true;
    this.editorId = conf.editorId;
  }

  getEditor(): Editor {
    return tinymce.get(this.editorId)!;
  }

  getContent(opts: ExtractContentForCheckOpts) {
    if (opts.checkSelection) {
      return this.getContentForCheckSelection(this.getEditorElement());
    } else {
      return this.getEditor().getContent({});
    }
  }

  getContentForCheckSelection = (el: HTMLElement) => this.getEditor().serializer.serialize(el, {}) as unknown as string;

  protected getSelection(): DocumentSelection {
    return { ranges: getSelectionHtmlRanges(this.getEditorElement(), this.getContentForCheckSelection) };
  }

  getEditorDocument() {
    return this.getEditor().getDoc();
  }
}
