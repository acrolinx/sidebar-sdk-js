/*
 * Copyright 2026-present Markup AI, Inc.
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

import { Check, DocumentSelection, Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { lookupMatches } from '../lookup/diff-based';
import { AlignedMatch } from '../utils/alignment';
import { isDangerousToReplace } from '../utils/match';
import {
  AdapterInterface,
  ContentExtractionResult,
  ExtractContentForCheckOpts,
  SuccessfulCheckResult,
} from './AdapterInterface';
import { EditorView } from 'prosemirror-view';
import { TextSelection } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import { encode } from 'entities';

/**
 * Returns the document position of the first character of the document's text content.
 * Required because ProseMirror positions include node boundaries (e.g. doc > paragraph > text),
 * while the sidebar uses flat 0-based indices into doc.textContent.
 */
function getContentStartOffset(doc: Node): number {
  let firstTextPos = 1;
  doc.descendants((node, pos) => {
    if (node.isText) {
      firstTextPos = pos;
      return false;
    }
  });
  return firstTextPos;
}

export type ProseMirrorAdapterConf = {
  editor: EditorView;
  format?: string; // See CheckOptions.inputFormat
};

export class ProseMirrorAdapter implements AdapterInterface {
  private config!: ProseMirrorAdapterConf;
  private currentContentChecking?: string;
  private lastContentChecked?: string;
  private formatDetectedByCheck: string | undefined;

  constructor(conf: ProseMirrorAdapterConf) {
    this.configure(conf);
  }

  configure(partialConfig: Partial<ProseMirrorAdapterConf>) {
    const newConf = { ...this.config, ...partialConfig };
    this.validateConf(newConf);
    this.config = newConf;
  }

  private validateConf(conf: ProseMirrorAdapterConf) {
    if (!conf) {
      throw new Error('ProseMirrorAdapter config is missing');
    }
    if (!conf.editor) {
      throw new Error('ProseMirrorAdapter config is missing "editor"');
    }
  }

  getContent(): string {
    return this.config.editor.state.doc.textContent ?? '';
  }

  getFormat(): string {
    return this.config.format ?? 'AUTO';
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): ContentExtractionResult {
    this.currentContentChecking = this.getContent();
    return {
      content: this.currentContentChecking,
      selection: opts.checkSelection ? this.getSelection() : undefined,
    };
  }

  private getSelection(): DocumentSelection {
    const { doc } = this.config.editor.state;
    const { from, to } = this.config.editor.state.selection;
    const offset = getContentStartOffset(doc);
    const range: [number, number] = [Math.min(from, to) - offset, Math.max(from, to) - offset];
    return { ranges: [range] };
  }

  registerCheckResult(checkResult: SuccessfulCheckResult): void {
    this.formatDetectedByCheck = checkResult.inputFormat;
    this.lastContentChecked = this.currentContentChecking;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  registerCheckCall(_checkInfo: Check) {
    return;
  }

  private lookupMatchesOrThrow<T extends Match>(matches: T[]): AlignedMatch<T>[] {
    const alignedMatches = lookupMatches(this.lastContentChecked!, this.getContent(), matches, 'TEXT');
    if (!alignedMatches || alignedMatches.length === 0) {
      throw new Error('Selected flagged content is modified.');
    }
    return alignedMatches;
  }

  selectRanges(_checkId: string, matches: Match[]) {
    const alignedMatches = this.lookupMatchesOrThrow(matches);
    const { doc } = this.config.editor.state;
    const offset = getContentStartOffset(doc);
    const from = alignedMatches[0].range[0] + offset;
    const to = alignedMatches.at(-1)!.range[1] + offset;
    this.selectRangeAndScroll([from, to]);
  }

  replaceRanges(_checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    const alignedMatches = this.lookupMatchesOrThrow(matchesWithReplacement);
    const escapeFunction = this.getEscapeFunction();

    let replacementLength = 0;
    alignedMatches
      .slice()
      .reverse()
      .forEach((match) => {
        if (!isDangerousToReplace(this.lastContentChecked!, match.originalMatch)) {
          const escapedReplacement = escapeFunction(match.originalMatch.replacement);
          const state = this.config.editor.state;
          const offset = getContentStartOffset(state.doc);
          const from = match.range[0] + offset;
          const to = match.range[1] + offset;
          const tr = state.tr;
          if (escapedReplacement.length > 0) {
            tr.replaceWith(from, to, state.schema.text(escapedReplacement));
          } else {
            tr.delete(from, to);
          }
          this.config.editor.dispatch(tr);
          replacementLength += escapedReplacement.length;
        }
      });

    const newState = this.config.editor.state;
    const offset = getContentStartOffset(newState.doc);
    const fromContent = alignedMatches[0].range[0];
    const toContent = fromContent + replacementLength;
    const from = fromContent + offset;
    const to = Math.min(toContent + offset, newState.doc.content.size);
    const tr = newState.tr.setSelection(TextSelection.create(newState.doc, from, to)).scrollIntoView();
    this.config.editor.dispatch(tr);
    this.config.editor.focus();
  }

  private getEscapeFunction(): (s: string) => string {
    const configuredFormat = this.getFormat();
    const format: string = (configuredFormat === 'AUTO' && this.formatDetectedByCheck) || configuredFormat;
    switch (format) {
      case 'XML':
      case 'HTML':
        return encode;
      default:
        return (value) => value;
    }
  }

  private selectRangeAndScroll(docRange: [number, number]) {
    const { state } = this.config.editor;
    const tr = state.tr.setSelection(TextSelection.create(state.doc, docRange[0], docRange[1])).scrollIntoView();
    this.config.editor.dispatch(tr);
    this.config.editor.focus();
  }
}
