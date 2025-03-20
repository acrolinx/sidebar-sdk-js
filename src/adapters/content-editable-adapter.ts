import { AbstractRichtextEditorAdapter } from './abstract-rich-text-editor-adapter';
import { getElementFromAdapterConf, AdapterConf } from './adapter-interface';
import { DocumentSelection } from '@acrolinx/sidebar-interface';
import { getSelectionHtmlRanges } from '../utils/check-selection';

export class ContentEditableAdapter extends AbstractRichtextEditorAdapter {
  element: HTMLElement;

  constructor(conf: AdapterConf) {
    super(conf);
    this.element = getElementFromAdapterConf(conf);
  }

  getEditorElement(): HTMLElement {
    return this.element;
  }

  getContent() {
    return this.element.innerHTML;
  }

  protected getSelection(): DocumentSelection {
    return { ranges: getSelectionHtmlRanges(this.getEditorElement()) };
  }

  getEditorDocument(): Document {
    return this.element.ownerDocument;
  }
}
