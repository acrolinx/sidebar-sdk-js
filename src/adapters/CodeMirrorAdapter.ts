/*
 *
 * * Copyright 2017 Acrolinx GmbH
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

import {Check, CheckResult, DocumentSelection, Match, MatchWithReplacement} from "../acrolinx-libs/plugin-interfaces";
import * as _ from "lodash";
import {AdapterInterface, ContentExtractionResult, ExtractContentForCheckOpts} from "./AdapterInterface";
import {AlignedMatch} from "../utils/alignment";
import {EditorFromTextArea} from "codemirror";
import {lookupMatches} from "../lookup/diff-based";

const FORMAT_BY_MODE: { [mime: string]: string } = {
  'xml/html': 'HTML',
  'text/html': 'HTML',
  'application/xml': 'XML',
  'text/x-markdown': 'MARKDOWN'
};

export type CodeMirrorAdapterConf = {
  editor: CodeMirror.Editor | EditorFromTextArea;
};

export class CodeMirrorAdapter implements AdapterInterface {
  private readonly config: CodeMirrorAdapterConf;
  private currentContentChecking: string;

  constructor(conf: CodeMirrorAdapterConf) {
    this.config = _.clone(conf);
  }

  getContent() {
    return this.config.editor.getValue();
  }

  getFormat() {
    return FORMAT_BY_MODE[this.config.editor.getOption('mode')] || 'AUTO';
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): ContentExtractionResult {
    this.currentContentChecking = this.getContent();
    return {
      content: this.currentContentChecking,
      selection: opts.checkSelection ? this.getSelection() : undefined
    };
  }

  private getSelection(): DocumentSelection {
    return {
      ranges: this.getDoc().listSelections().map(this.cmSelectionToRange)
    };
  }

  registerCheckResult(_checkResult: CheckResult): void {
  }

  registerCheckCall(_checkInfo: Check) {
  }

  private lookupMatchesOrThrow<T extends Match>(matches: T[]): AlignedMatch<T>[] {
    const alignedMatches = lookupMatches(this.currentContentChecking, this.getContent(), matches);
    if (_.isEmpty(alignedMatches)) {
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

    _.forEachRight(alignedMatches, match => {
      const positionRange = this.selectRange(match.range);
      doc.replaceRange(match.originalMatch.replacement, positionRange[0], positionRange[1]);
    });

    const completeReplacement = matchesWithReplacement.map(m => m.replacement).join('');
    this.selectRangeAndScroll([alignedMatches[0].range[0], alignedMatches[0].range[0] + completeReplacement.length]);
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

  private cmSelectionToRange = (selection: { anchor: CodeMirror.Position; head: CodeMirror.Position }): [number, number] => {
    const doc = this.getDoc();
    return [doc.indexFromPos(selection.anchor), doc.indexFromPos(selection.head)];
  }

}
