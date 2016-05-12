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

  export class TinyMCEWordpressAdapter extends TinyMCEAdapter {

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
      const editorBody = (this.getEditor() as any).getBody();
      const parentWidth = (this.getEditor() as any).getContainer().clientWidth;
      const bodyClientWidthWithMargin = editorBody.scrollWidth;
      const hasVerticalScrollbar = parentWidth > bodyClientWidthWithMargin;
      if (hasVerticalScrollbar) {
        super.scrollToCurrentSelection();
      } else {
        this.scrollToCurrentSelectionWithGlobalScrollbar();
      }
    }

    scrollToCurrentSelectionWithGlobalScrollbar() {
      const selection1 = this.getEditorDocument().getSelection();

      if (selection1) {
        try {
          this.scrollIntoViewWithGlobalScrollbar(selection1);
        } catch (error) {
          console.log('Scrolling Error: ', error);
        }
      }
    }

    protected scrollIntoViewWithGlobalScrollbar(sel: Selection) {
      const range = sel.getRangeAt(0);
      const tmp = range.cloneRange();
      tmp.collapse(false);

      const text = document.createElement('span');
      tmp.insertNode(text);
      const ypos = text.getClientRects()[0].top;
      window.scrollTo(0, ypos);
      text.remove();
    }

  }
}
