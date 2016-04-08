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

/// <reference path="../lookup/diff-based.ts" />
/// <reference path="AbstractRichtextEditorAdapter.ts" />

namespace acrolinx.plugins.adapter {
  'use strict';

  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;

  export class CKEditorAdapter extends AbstractRichtextEditorAdapter {
    getEditor() {
      if (this.editor === null) {
        if (CKEDITOR.instances.hasOwnProperty(this.editorId)) {
          this.editor = CKEDITOR.instances[this.editorId];
        }
      }
      return this.editor;
    }

    getEditorDocument() : Document {
      return this.getEditor().document.$;
    }

    getHTML() {
      return this.getEditor().getData();
    }

    extractHTMLForCheck(): any {
      this.html = this.getHTML();
      this.currentHtmlChecking = this.html;
      if (this.editor.mode === 'wysiwyg') {
        //TODO: remove it after server side implementation. This is a workaround
        if (this.html === '') {
          this.html = '<span> </span>';
        }
      } else {
        if (this.isCheckingNow) {
          this.isCheckingNow = false;
        } else {
          return {error: "Action is not permitted in Source mode."};
        }
      }
      return {html: this.html};
    }

    selectRanges(checkId, matches) {
      if (this.editor.mode === 'wysiwyg') {
        super.selectRanges(checkId, matches);
      } else {
        window.alert('Action is not permitted in Source mode.');
      }
    }

    replaceRanges(checkId, matchesWithReplacementArg: MatchWithReplacement[]) {
      if (this.editor.mode === 'wysiwyg') {
        super.replaceRanges(checkId, matchesWithReplacementArg);
      } else {
        window.alert('Action is not permitted in Source mode.');
      }
    }
  }
}