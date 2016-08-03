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

import {Match, MatchWithReplacement} from "../acrolinx-libs/plugin-interfaces";
import {AbstractRichtextEditorAdapter} from "./AbstractRichtextEditorAdapter";
import {HasEditorID, ContentExtractionResult} from "./AdapterInterface";


export class CKEditorAdapter extends AbstractRichtextEditorAdapter {
  editorId: string;

  constructor(conf: HasEditorID) {
    super(conf);
    this.editorId = conf.editorId;
  }

  getEditor() {
    return CKEDITOR.instances[this.editorId];
  }

  getEditorDocument(): Document {
    return this.getEditor().document.$ as any;
  }

  getContent() {
    return this.getEditor().getData();
  }

  extractContentForCheck(): ContentExtractionResult {
    this.html = this.getContent();
    this.currentHtmlChecking = this.html;
    if (this.isInWysiwygMode()) {
      // TODO: remove it after server side implementation. This is a workaround
      if (this.html === '') {
        this.html = '<span> </span>';
      }
    } else {
      if (this.isCheckingNow) {
        this.isCheckingNow = false;
      } else {
        return {error: 'Action is not permitted in Source mode.'};
      }
    }
    return {content: this.html};
  }

  selectRanges(checkId: string, matches: Match[]) {
    if (this.isInWysiwygMode()) {
      super.selectRanges(checkId, matches);
    } else {
      window.alert('Action is not permitted in Source mode.');
    }
  }

  replaceRanges(checkId: string, matchesWithReplacementArg: MatchWithReplacement[]) {
    if (this.isInWysiwygMode()) {
      super.replaceRanges(checkId, matchesWithReplacementArg);
    } else {
      window.alert('Action is not permitted in Source mode.');
    }
  }

  isInWysiwygMode() {
    return this.getEditor().mode === 'wysiwyg';
  }
}