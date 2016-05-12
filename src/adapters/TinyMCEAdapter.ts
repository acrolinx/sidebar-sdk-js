/*
 *
 * * Copyright 2015 Acrolinx GmbH
 * *
 * * Licensed under the Apache License, Version 2.0 (the "License");
 * * you may not use this file except in compliance with the License.
 * * You may obtain a copy of the License at
 * *
 * * http://www.apache.org/licenses/LICENSE-2.0
 * *
 * * Unless required by applicable law or agreed to in writing, software
 * * distributed under the License is distributed on an "AS IS" BASIS,
 * * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * * See the License for the specific language governing permissions and
 * * limitations under the License.
 * *
 * * For more information visit: http://www.acrolinx.com
 *
 */

namespace acrolinx.plugins.adapter {
  'use strict';

  export class TinyMCEAdapter extends AbstractRichtextEditorAdapter {
    editorId: string;

    constructor(conf: HasEditorID) {
      super(conf);
      this.editorId = conf.editorId;
    }

    getEditor() {
      return tinymce.get(this.editorId);
    }

    getContent() {
      return this.getEditor().getContent();
    }

    getEditorDocument() {
      return this.getEditor().getDoc();
    }

    scrollToCurrentSelection() {
      const selection = this.getEditorDocument().getSelection();
      if (selection) {
        try {
          const originalRange = selection.getRangeAt(0);
          const {startContainer , startOffset, endContainer, endOffset} = originalRange;
          selection.collapseToStart();

          (this.getEditor() as any).insertContent('');

          const restoredRange = this.getEditorDocument().createRange();
          restoredRange.setStart(startContainer, startOffset);
          restoredRange.setEnd(endContainer, endOffset);

          selection.removeAllRanges();
          selection.addRange(restoredRange);

        } catch (error) {
          console.log('Scrolling Error: ', error);
        }
      }
    }

  }
}
