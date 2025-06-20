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

import { Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { AbstractRichtextEditorAdapter } from './abstract-rich-text-editor-adapter';
import { HasEditorID, ContentExtractionResult } from './adapter-interface';

export class CKEditor4Adapter extends AbstractRichtextEditorAdapter {
  editorId: string;

  constructor(conf: HasEditorID) {
    super(conf);
    this.editorId = conf.editorId;
  }

  getEditor(): CKEDITOR.editor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ckeditor = CKEDITOR.instances[this.editorId as any];
    if (!ckeditor) {
      throw new Error(`Can't find ckeditor with id '${this.editorId}'`);
    }
    return ckeditor;
  }

  getEditorDocument(): Document {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.getEditor().document.$ as any;
  }

  getContent() {
    return this.getEditor().getData();
  }

  extractContentForCheck(): ContentExtractionResult {
    if (this.isInWysiwygMode()) {
      this.currentContentChecking = this.getContent();
      return { content: this.currentContentChecking };
    } else {
      return { error: 'Action is not permitted in Source mode.' };
    }
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
