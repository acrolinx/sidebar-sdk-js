/*
 * Copyright 2015-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {AbstractRichtextEditorAdapter} from './AbstractRichtextEditorAdapter';
import {getElementFromAdapterConf, AdapterConf} from './AdapterInterface';
import {DocumentSelection} from '@acrolinx/sidebar-interface';
import {getSelectionHtmlRanges} from '../utils/check-selection';

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
    return {ranges: getSelectionHtmlRanges(this.getEditorElement())};
  }

  getEditorDocument(): Document {
    return this.element.ownerDocument;
  }
}

