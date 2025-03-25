import { Match } from '@acrolinx/sidebar-interface';
import { OffSetAlign, findNewIndex, AlignedMatch } from '../utils/alignment';
import { extractText } from '../utils/text-extraction';
import { log } from '../utils/logging';
import { diff_match_patch, DIFF_EQUAL, DIFF_DELETE, DIFF_INSERT, Diff } from 'diff-match-patch';
import { rangeContent } from '../utils/match';

export type InputFormat = 'HTML' | 'TEXT';

const dmp = new diff_match_patch();
dmp.Diff_Timeout = 5;

export function createOffsetMappingArray(diffs: Diff[]): OffSetAlign[] {
  const offsetMappingArray: OffSetAlign[] = [];
  let offsetCountOld = 0;
  let currentDiffOffset = 0;
  diffs.forEach((diff: Diff) => {
    const [action, value] = diff;
    switch (action) {
      case DIFF_EQUAL:
        offsetCountOld += value.length;
        break;
      case DIFF_DELETE:
        offsetCountOld += value.length;
        currentDiffOffset -= value.length;
        break;
      case DIFF_INSERT:
        currentDiffOffset += value.length;
        break;
      default:
        throw new Error('Illegal Diff Action: ' + action);
    }
    offsetMappingArray.push({
      oldPosition: offsetCountOld,
      diffOffset: currentDiffOffset,
    });
  });
  return offsetMappingArray;
}

/**
 * @param {string} checkedDocument Text or HTML of the document (at check time)
 * @param {string} currentDocument Text or HTML of the current document
 *
 * @param {T[]} matches
 *
 * @param {InputFormat} inputFormat
 * If checkedDocument is the HTML of the document (at check time)
 * and currentDocument is the extracted text of the current document then
 * you should set inputFormat to 'HTML'.
 *
 * @return {AlignedMatch<T extends Match>[]}
 */
export function lookupMatches<T extends Match>(
  checkedDocument: string,
  currentDocument: string,
  matches: T[],
  inputFormat: InputFormat = 'HTML',
): AlignedMatch<T>[] {
  if (matches.length === 0) {
    return [];
  }

  const cleaningResult: [string, OffSetAlign[]] =
    inputFormat === 'HTML' ? extractText(checkedDocument) : [checkedDocument, []];
  const [cleanedCheckedDocument, cleaningOffsetMappingArray] = cleaningResult;
  const diffs: Diff[] = dmp.diff_main(cleanedCheckedDocument, currentDocument);
  const offsetMappingArray = createOffsetMappingArray(diffs);

  const alignedMatches = matches.map((match) => {
    const beginAfterCleaning = findNewIndex(cleaningOffsetMappingArray, match.range[0]);
    const endAfterCleaning = findNewIndex(cleaningOffsetMappingArray, match.range[1]);
    const alignedBegin = findNewIndex(offsetMappingArray, beginAfterCleaning);
    const lastCharacterPos = endAfterCleaning - 1;
    const alignedEnd = findNewIndex(offsetMappingArray, lastCharacterPos) + 1;
    return {
      originalMatch: match,
      range: [alignedBegin, alignedEnd] as [number, number],
    };
  });

  const containsModifiedMatches =
    inputFormat === 'HTML'
      ? alignedMatches.some((m) => rangeContent(currentDocument, m) !== m.originalMatch.content)
      : alignedMatches.some((m) => rangeContent(currentDocument, m) !== rangeContent(checkedDocument, m.originalMatch));

  log('cleanedCheckedDocument', cleanedCheckedDocument);
  log(
    'cleanedCheckedDocumentCodes',
    cleanedCheckedDocument.split('').map((c) => c.charCodeAt(0)),
  );
  log('currentDocument', currentDocument);
  log(
    'currentDocumentCodes',
    currentDocument.split('').map((c) => c.charCodeAt(0)),
  );
  log('matches', matches);
  log('diffs', diffs);
  log('alignedMatches', alignedMatches);
  log(
    'alignedMatchesContent',
    alignedMatches.map((m) => rangeContent(currentDocument, m)),
  );

  return containsModifiedMatches ? [] : alignedMatches;
}
