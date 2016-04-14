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

    getEditor() {
      return tinymce.get(this.editorId);
    }

    getHTML() {
      return this.getEditor().getContent();
    }

    getEditorDocument() {
      return this.getEditor().getDoc();
    }

    scrollToCurrentSelection3() {
      // scroll when tiny mce has own scrollbar

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

          // const wpContainer = document.getElementById('wp-content-editor-container');
          // if (wpContainer) {
          //  wpContainer.scrollIntoView();
          // }

        } catch (error) {
          console.log('Scrolling Error: ', error);
        }
      }
    }

    scrollToCurrentSelection2() {
      // scroll for full page view
      // super.scrollToCurrentSelection();
      const wpContainer = document.getElementById('wp-content-editor-container');
      if (wpContainer) {
        wpContainer.scrollIntoView();
      }
      window.scrollBy(0, -150);
    }

    // scrollAndSelect(matches) {
    //   var newBegin, matchLength, selection1, range1, range2,
    //
    //     newBegin = matches[0].foundOffset;
    //   matchLength = matches[0].flagLength;
    //   range1 = this.selectText(newBegin, matchLength);
    //   selection1 = this.getEditor().selection;
    //
    //   if (selection1) {
    //     try {
    //       //selection1.scrollIntoView();
    //       this.scrollIntoView2(selection1);
    //       //Special hack for WordPress TinyMCE
    //       var wpContainer = acrolinxLibs.$('#wp-content-editor-container');
    //       if (wpContainer.length > 0) {
    //         wpContainer.get(0).scrollIntoView();
    //       }
    //     } catch (error) {
    //       console.log("Scrolling Error!");
    //     }
    //   }
    //   //
    //   // scrollIntoView need to set it again
    //   range2 = this.selectText(newBegin, matchLength);
    //   return range2;
    // }

  }
}
