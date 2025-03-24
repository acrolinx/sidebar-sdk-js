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
import { EditorView } from '@codemirror/view';
import _ from 'lodash';

export type CodeMirror6AdapterConf = {
  editor: EditorView;
  format?: string; // See CheckOptions.inputFormat
};

export class CodeMirror6Adapter implements AdapterInterface {
  private config!: CodeMirror6AdapterConf;
  private currentContentChecking?: string;
  private lastContentChecked?: string;
  private formatDetectedByCheck: string | undefined;

  constructor(conf: CodeMirror6AdapterConf) {
    this.configure(conf);
  }

  configure(partialConfig: Partial<CodeMirror6AdapterConf>) {
    const newConf = { ...this.config, ...partialConfig };
    this.validateConf(newConf);
    this.config = newConf;
  }

  private validateConf(conf: CodeMirror6AdapterConf) {
    if (!conf) {
      throw new Error('CodeMirrorAdapter config is missing');
    }
    if (!conf.editor) {
      throw new Error('CodeMirrorAdapter config is missing "editor"');
    }
  }

  getContent() {
    return this.config.editor.state.doc.toString();
  }

  getFormat() {
    return this.config.format || 'AUTO';
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
      ranges: this.config.editor.state.selection.ranges.map(this.cmSelectionToRange),
    };
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
    const alignedMatches = this.lookupMatchesOrThrow(matchesWithReplacement);
    const escapeFunction = this.getEscapeFunction();

    let replacementLength = 0;
    alignedMatches
      .slice()
      .reverse()
      .forEach((match) => {
        if (!isDangerousToReplace(this.lastContentChecked!, match.originalMatch)) {
          const escapedReplacement = escapeFunction(match.originalMatch.replacement);
          this.config.editor.dispatch({
            changes: {
              from: match.range[0],
              to: match.range[1],
              insert: escapedReplacement,
            },
          });

          replacementLength += escapedReplacement.length;
        }
      });

    this.selectRangeAndScroll([alignedMatches[0].range[0], alignedMatches[0].range[0] + replacementLength]);
  }

  private getEscapeFunction(): (s: string) => string {
    const configuredFormat = this.getFormat();
    const format: string = (configuredFormat === 'AUTO' && this.formatDetectedByCheck) || configuredFormat;
    switch (format) {
      case 'XML':
      case 'HTML':
        return _.escape;
      default:
        return _.identity;
    }
  }

  private selectRange(range: [number, number]): [number, number] {
    this.config.editor.dispatch({ selection: { anchor: range[0], head: range[1] }, scrollIntoView: true });
    return [range[0], range[1]];
  }

  private selectRangeAndScroll(range: [number, number]) {
    this.selectRange(range);
    this.config.editor.focus();
  }

  private cmSelectionToRange = (selection: { from: number; to: number }): [number, number] => {
    const range: [number, number] = [selection.from, selection.to];
    range.sort((a, b) => a - b);
    return range;
  };
}
