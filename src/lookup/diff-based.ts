/*
 *
 * * Copyright 2016 Acrolinx GmbH
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

/// <reference path="../typings/diff-match-patch.d.ts" />
/// <reference path="../utils/logging.ts" />
/// <reference path="../utils/alignment.ts" />

namespace acrolinx.plugins.lookup.diffbased {
  'use strict';

  import Match = acrolinx.sidebar.Match;
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;
  import _ = acrolinxLibs._;
  import log = acrolinx.plugins.utils.log;
  import OffSetAlign = acrolinx.plugins.utils.OffSetAlign;
  import findNewIndex = acrolinx.plugins.utils.findNewIndex;
  const {DIFF_EQUAL, DIFF_DELETE, DIFF_INSERT} = acrolinx.diffMatchPatch;

  type InputFormat = 'HTML' | 'TEXT';

  const dmp = new acrolinx.diffMatchPatch.DiffMatchPatch();

  export function createOffsetMappingArray(diffs: Diff[]): OffSetAlign[] {
    let offsetMappingArray: OffSetAlign[] = [];
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
        diffOffset: currentDiffOffset
      });
    });
    return offsetMappingArray;
  }

  function decodeEntities(entity: string) {
    const el = document.createElement('div');
    el.innerHTML = entity;
    return el.textContent;
  }


  // Exported for testing
  export function replaceTags(s: string): [string, OffSetAlign[]] {
    const regExp = /(<([^>]+)>|&.*?;)/ig;
    const offsetMapping: OffSetAlign[] = [];
    let currentDiffOffset = 0;
    const resultText = s.replace(regExp, (tagOrEntity, p1, p2, offset) => {
      const rep = _.startsWith(tagOrEntity, '&') ? decodeEntities(tagOrEntity) : '';
      currentDiffOffset -= tagOrEntity.length - rep.length;
      offsetMapping.push({
        oldPosition: offset + tagOrEntity.length,
        diffOffset: currentDiffOffset
      });
      return rep;
    });
    return [resultText, offsetMapping];
  }


  function rangeContent(content: string, m: AlignedMatch<Match>) {
    return content.slice(m.range[0], m.range[1]);
  }


  export function lookupMatches<T extends Match>(checkedDocument: string, currentDocument: string,
                                                 matches: T[], inputFormat: InputFormat = 'HTML'): AlignedMatch<T>[] {
    if (_.isEmpty(matches)) {
      return [];
    }
    const [cleanedCheckedDocument, cleaningOffsetMappingArray] = inputFormat === 'HTML' ? replaceTags(checkedDocument) : [checkedDocument, []];
    const diffs: Diff[] = dmp.diff_main(cleanedCheckedDocument, currentDocument);
    const offsetMappingArray = createOffsetMappingArray(diffs);

    const alignedMatches = matches.map(match => {
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

    const containsModifiedMatches = _.some(alignedMatches, m => rangeContent(currentDocument, m) !== m.originalMatch.content);

    log('checkedDocument', checkedDocument);
    log('cleanedCheckedDocument', cleanedCheckedDocument);
    log('cleanedCheckedDocumentCodes', cleanedCheckedDocument.split('').map(c => c.charCodeAt(0)));
    log('currentDocument', currentDocument);
    log('currentDocumentCodes', currentDocument.split('').map(c => c.charCodeAt(0)));
    log('matches', matches);
    log('diffs', diffs);
    log('alignedMatches', alignedMatches);
    log('alignedMatchesContent', alignedMatches.map(m => rangeContent(currentDocument, m)));

    return containsModifiedMatches ? [] : alignedMatches;
  }


}