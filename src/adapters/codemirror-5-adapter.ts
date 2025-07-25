/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * Copyright 2017-present Acrolinx GmbH
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

import { EditorFromTextArea } from 'codemirror';
import { Check, DocumentSelection, Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { lookupMatches } from '../lookup/diff-based';
import { AlignedMatch } from '../utils/alignment';
import { isDangerousToReplace } from '../utils/match';
import {
  AdapterInterface,
  ContentExtractionResult,
  ExtractContentForCheckOpts,
  SuccessfulCheckResult,
} from './adapter-interface';
import { encode } from 'entities';

const FORMAT_BY_MIME_TYPE: { [mime: string]: string } = {
  'text/html': 'HTML',
  'text/xml': 'HTML',
  'application/xml': 'XML',
  'text/x-markdown': 'MARKDOWN',
  'text/plain': 'TEXT',
};

const FORMAT_BY_MODE: { [mode: string]: string } = {
  htmlmixed: 'HTML',
  xml: 'XML',
  markdown: 'MARKDOWN',
};

export type CodeMirrorAdapterConf = {
  editor: CodeMirror.Editor | EditorFromTextArea;
  format?: string; // See CheckOptions.inputFormat
};

export class CodeMirror5Adapter implements AdapterInterface {
  private config!: CodeMirrorAdapterConf;
  private currentContentChecking?: string;
  private lastContentChecked?: string;
  private formatDetectedByCheck: string | undefined;

  constructor(conf: CodeMirrorAdapterConf) {
    this.configure(conf);
  }

  configure(partialConfig: Partial<CodeMirrorAdapterConf>) {
    const newConf = { ...this.config, ...partialConfig };
    this.validateConf(newConf);
    this.config = newConf;
  }

  private validateConf(conf: CodeMirrorAdapterConf) {
    if (!conf) {
      throw new Error('CodeMirrorAdapter config is missing');
    }
    if (!conf.editor) {
      throw new Error('CodeMirrorAdapter config is missing "editor"');
    }
  }

  getContent() {
    return this.config.editor.getValue();
  }

  getFormat() {
    return this.config.format || this.getFormatFromCodeMirror() || 'AUTO';
  }

  private getFormatFromCodeMirror() {
    return (
      FORMAT_BY_MODE[this.config.editor.getDoc().getMode().name || ''] ||
      FORMAT_BY_MIME_TYPE[this.config.editor.getOption('mode')! as string]
    );
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): ContentExtractionResult {
    this.currentContentChecking = this.getContent();
    return {
      content: this.currentContentChecking,
      selection: opts.checkSelection ? this.getSelection() : undefined,
    };
  }

  private getSelection(): DocumentSelection {
    return {
      ranges: this.getDoc().listSelections().map(this.cmSelectionToRange),
    };
  }

  registerCheckResult(checkResult: SuccessfulCheckResult): void {
    this.formatDetectedByCheck = checkResult.inputFormat;
    this.lastContentChecked = this.currentContentChecking;
  }

  registerCheckCall(_checkInfo: Check) {}

  private lookupMatchesOrThrow<T extends Match>(matches: T[]): AlignedMatch<T>[] {
    const alignedMatches = lookupMatches(this.lastContentChecked!, this.getContent(), matches, 'TEXT');
    if (alignedMatches.length === 0) {
      throw Error('Selected flagged content is modified.');
    }
    return alignedMatches;
  }

  selectRanges(_checkId: string, matches: Match[]) {
    const alignedMatches = this.lookupMatchesOrThrow(matches);
    this.selectRangeAndScroll([alignedMatches[0].range[0], alignedMatches[alignedMatches.length - 1].range[1]]);
  }

  replaceRanges(_checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    const doc = this.getDoc();
    const alignedMatches = this.lookupMatchesOrThrow(matchesWithReplacement);
    const escapeFunction = this.getEscapeFunction();

    let replacementLength = 0;
    for (const match of [...alignedMatches].reverse()) {
      if (!isDangerousToReplace(this.lastContentChecked!, match.originalMatch)) {
        const [start, end] = this.selectRange(match.range);
        const escapedReplacement = escapeFunction(match.originalMatch.replacement);
        doc.replaceRange(escapedReplacement, start, end);
        replacementLength += escapedReplacement.length;
      }
    }

    this.selectRangeAndScroll([alignedMatches[0].range[0], alignedMatches[0].range[0] + replacementLength]);
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

  private getDoc() {
    return this.config.editor.getDoc();
  }

  private selectRange(range: [number, number]): [CodeMirror.Position, CodeMirror.Position] {
    const doc = this.getDoc();
    const startPos = doc.posFromIndex(range[0]);
    const endPos = doc.posFromIndex(range[1]);
    doc.setSelection(startPos, endPos);
    return [startPos, endPos];
  }

  private selectRangeAndScroll(range: [number, number]) {
    const positionRange = this.selectRange(range);
    const editor = this.config.editor;
    editor.scrollIntoView(positionRange[0]);
    editor.focus();
  }

  private cmSelectionToRange = (selection: {
    anchor: CodeMirror.Position;
    head: CodeMirror.Position;
  }): [number, number] => {
    const doc = this.getDoc();
    const range: [number, number] = [doc.indexFromPos(selection.anchor), doc.indexFromPos(selection.head)];
    range.sort((a, b) => a - b);
    return range;
  };
}
