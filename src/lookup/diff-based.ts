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

namespace acrolinx.plugins.lookup.diffbased {
  'use strict';

  import Match = acrolinx.sidebar.Match;
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;
  import _ = acrolinxLibs._;

  type InputFormat = 'HTML' | 'TEXT';

  const dmp = new diff_match_patch();

  interface OffSetAlign {
    oldPosition: number;
    diffOffset: number;
  }
  

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

  
  // Exported for testing
  export function replaceTags(s: string): [string, OffSetAlign[]] {
    const regExp = /(<([^>]+)>|&.*?;)/ig;
    const offsetMapping: OffSetAlign[] = [];
    let currentDiffOffset = 0;
    const resultText = s.replace(regExp, (tag, p1, p2, offset) => {
      currentDiffOffset -= tag.length;
      offsetMapping.push({
        oldPosition: offset + tag.length,
        diffOffset: currentDiffOffset
      });
      return '';
    });
    return [resultText, offsetMapping];
  }

  
  export function findNewOffset(offsetMappingArray: OffSetAlign[], oldOffset: number) {
    if (offsetMappingArray.length === 0) {
      return 0;
    }
    const index = _.sortedIndexBy(offsetMappingArray,
      {diffOffset: 0, oldPosition: oldOffset + 0.1},
      offsetAlign => offsetAlign.oldPosition
    );
    return index > 0 ? offsetMappingArray[index - 1].diffOffset : 0;
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
      const beginAfterCleaning = match.range[0] + findNewOffset(cleaningOffsetMappingArray, match.range[0]);
      const endAfterCleaning = match.range[1] + findNewOffset(cleaningOffsetMappingArray, match.range[1]);
      const alignedBegin = beginAfterCleaning + findNewOffset(offsetMappingArray, beginAfterCleaning);
      const alignedEnd = endAfterCleaning + findNewOffset(offsetMappingArray, endAfterCleaning);
      return {
        originalMatch: match,
        range: [alignedBegin, alignedEnd] as [number, number]
      };
    });

    const containsModifiedMatches = _.some(alignedMatches, m =>
    rangeContent(currentDocument, m) !== m.originalMatch.content);

    return containsModifiedMatches ? [] : alignedMatches;
  }


}