import {AbstractRichtextEditorAdapter} from './AbstractRichtextEditorAdapter';
import {AdapterConf, AsyncAdapterInterface, getElementFromAdapterConf} from './AdapterInterface';
import {AlignedMatch} from '../utils/alignment';
import {DocumentSelection, Match, MatchWithReplacement} from '@acrolinx/sidebar-interface';
import * as _ from 'lodash';
import {getSelectionHtmlRanges, lookupMatches} from '..';
import {getCompleteFlagLength} from '../utils/match';
import {assertElementIsDisplayed} from '../utils/utils';
import {TextDomMapping} from '../utils/text-dom-mapping';

type TextMapping = TextDomMapping;

export class DraftKenticoAdapter extends AbstractRichtextEditorAdapter implements AsyncAdapterInterface {
  element: HTMLElement;
  readonly isAsync: true;
  readonly requiresSynchronization: boolean;

  constructor(conf: AdapterConf) {
    super(conf);
    this.element = getElementFromAdapterConf(conf);
    this.isAsync = true;
    this.requiresSynchronization = true;
  }

  getEditorElement(): HTMLElement {
    return this.element;
  }

  getContent() {
    return this.element.innerHTML;
  }

  protected getSelection(): DocumentSelection {
    return {ranges: getSelectionHtmlRanges(this.getEditorElement() as HTMLElement)};
  }

  getEditorDocument(): Document {
    return this.element.ownerDocument!;
  }

  private async selectTextL(begin: number, length: number, textMapping: TextMapping) {
    return new Promise((resolve) => {
      if (!textMapping.text) {
        resolve();
      }
      const selection = this.getEditorDocument().getSelection();
      if (!selection) {
        console.warn('AbstractRichtextEditorAdapter.selectText: Missing selection');
        resolve();
      }
      selection!.removeAllRanges();
      setTimeout(() => {
        selection!.addRange(super.createRange(begin, length, textMapping));
        setTimeout(() => {
          this.getEditorElement().focus();
          resolve();
        }, 0);
      }, 0);
    });
  }

  private async insertWithCommandExecAtCursorPosition(range: Range, replacement: string): Promise<void> {
    range.collapse(false);
    let selection = document.getSelection();
    selection?.removeAllRanges();
    // this.getEditorElement().click();
    setTimeout(() => {
      // set cursor
      selection?.addRange(range);
      setTimeout(() => {
        this.getEditorElement().focus();
        document.execCommand('insertText', true, replacement);
        return Promise.resolve();
      });
    }, 0);
  }

  private async replaceAlignedMatchesL(matches: AlignedMatch<MatchWithReplacement>[]): Promise<void> {
    // const doc = this.getEditorDocument();
    const reversedMatches = _.clone(matches).reverse();
    for (let match of reversedMatches) {
      const textDomMapping = super.getTextDomMapping();
      const rangeLength = match.range[1] - match.range[0];
      if (rangeLength > 1) {
        const tail = super.createRange(match.range[0] + 1, rangeLength - 1, textDomMapping);
        const head = super.createRange(match.range[0], 1, textDomMapping);
        tail.deleteContents();
        head.deleteContents();

        await this.insertWithCommandExecAtCursorPosition(head, match.originalMatch.replacement);
        // this.getEditorElement().focus();

        // this.dispatchPaste(this.getEditorElement(), match.originalMatch.replacement);
        // head.insertNode(doc.createTextNode(match.originalMatch.replacement));


        // this.dispatchPaste(this.getEditorElement(), match.originalMatch.replacement);
        // head = this.createRange(match.range[0], 1, textDomMapping);
        // selection?.removeRange(head);
        // selection?.removeAllRanges();

        // removeEmptyTextNodesIfNeeded(tail);
        // if (tail.startContainer !== head.startContainer || tail.endContainer !== head.endContainer) {
        //   removeEmptyTextNodesIfNeeded(head);
        // }
      } else {
        let range = this.createRange(match.range[0], rangeLength, textDomMapping);
        range.deleteContents();
        await this.insertWithCommandExecAtCursorPosition(range, match.originalMatch.replacement);
        // selection?.addRange(range);
        // this.getEditorElement().focus();

        // this.dispatchPaste(this.getEditorElement(), match.originalMatch.replacement);
        // range.insertNode(doc.createTextNode(match.originalMatch.replacement));
        // document.execCommand('insertText', true, match.originalMatch.replacement);
        // this.dispatchPaste(this.getEditorElement(), match.originalMatch.replacement);
        // selection?.removeRange(range);
        // range = this.createRange(match.range[0], rangeLength, textDomMapping);
        // removeEmptyTextNodesIfNeeded(range);
      }
    }
  }

  async selectRanges(checkId: string, matches: Match[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      assertElementIsDisplayed(this.getEditorElement());
      this.selectMatchesL(checkId, matches).then(() => {
        this.scrollToCurrentSelection();
        resolve();
      }).catch((e) => {
        reject(e);
      });
    });
  }

  private async selectMatchesL<T extends Match>(_checkId: string, matches: T[]): Promise<[AlignedMatch<T>[], TextMapping]> {
    const textMapping: TextMapping = super.getTextDomMapping();
    const alignedMatches: AlignedMatch<T>[] = lookupMatches(this.lastContentChecked!, textMapping.text, matches);

    if (_.isEmpty(alignedMatches)) {
      throw new Error('Selected flagged content is modified.');
    }

    await this.selectAlignedMatchesL(alignedMatches, textMapping);
    return [alignedMatches, textMapping];
  }

  private async selectAlignedMatchesL(matches: AlignedMatch<Match>[], textMapping: TextMapping) {
    const newBegin = matches[0].range[0];
    const matchLength = getCompleteFlagLength(matches);
    return this.selectTextL(newBegin, matchLength, textMapping);
  }


  // private dispatchPaste(target: any, text: any) {
  //   const data = new DataTransfer();
  //   data.setData(
  //     // this could also be 'text/plain' -- it probably matters, but I'm not sure in which way
  //     'text/html',
  //     text
  //   );
  //   target.dispatchEvent(
  //     new ClipboardEvent('paste', {
  //       clipboardData: data,
  //       // need these for the event to reach Draft paste handler
  //       bubbles: true,
  //       cancelable: true
  //     })
  //   );
  // }

  async replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): Promise<void> {
    assertElementIsDisplayed(this.getEditorElement());
    const [alignedMatches] = await this.selectMatchesL(checkId, matchesWithReplacement);
    // const replacement = alignedMatches.map(m => m.originalMatch.replacement).join('');
    await this.replaceAlignedMatchesL(alignedMatches);
    // Replacement will remove the selection, so we need to restore it again.
    // this.selectText(alignedMatches[0].range[0], replacement.length, this.getTextDomMapping());
    // this.scrollToCurrentSelection();
  }


}

export function isDraftJSKentico(el: Element) {
  return el.classList.contains('public-DraftEditor-content');
}
