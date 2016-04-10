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

  function replaceTags(s: string) {
    return s.replace(/(<([^>]+)>|&.*?;)/ig, tag => _.repeat(' ', tag.length));
  }


  function findNewOffset(diffs: Diff[], offsetMappingArray: OffSetAlign[], oldOffset: number) {
    let index = _.findIndex(offsetMappingArray, (offSetAlign: OffSetAlign) => {
      return offSetAlign.oldPosition > oldOffset;
    });
    if (index > 0) {
      return offsetMappingArray[index - 1].diffOffset;
    }
    else if (offsetMappingArray.length > 1 && index === -1) {
      if (diffs[offsetMappingArray.length - 1][0] === DIFF_EQUAL) {
        return offsetMappingArray[offsetMappingArray.length - 1].diffOffset;
      }
      return offsetMappingArray[offsetMappingArray.length - 2].diffOffset;
    }
    else if (index === 0) {
      return offsetMappingArray[0].diffOffset;
    }
    else return 0;
  }

  function rangeContent(content: string, m: AlignedMatch<Match>) {
    return content.slice(m.range[0], m.range[1]);
  }

  export function lookupMatches<T extends Match>(checkedDocument: string, currentDocument: string,
                                                 matches: T[], inputFormat: InputFormat = 'HTML'): AlignedMatch<T>[] {
    if (_.isEmpty(matches)) {
      return [];
    }
    // const start = Date.now();
    const cleanedCheckedDocument = inputFormat === 'HTML' ? replaceTags(checkedDocument) : checkedDocument;
    const diffs: Diff[] = dmp.diff_main(cleanedCheckedDocument, currentDocument);

    // console.log(checkedDocument, currentDocument, diffs);

    const offsetMappingArray = createOffsetMappingArray(diffs);

    const alignedMatches = matches.map(match => {
      const foundBegin = match.range[0] + findNewOffset(diffs, offsetMappingArray, match.range[0]);
      const foundEnd = match.range[1] + findNewOffset(diffs, offsetMappingArray, match.range[1]);
      return {
        originalMatch: match,
        range: [foundBegin, foundEnd] as [number, number]
      };
    });

    const containsModifiedMatches = _.some(alignedMatches, m =>
    rangeContent(currentDocument, m) !== m.originalMatch.content);

    // console.log('Time for Diffing: ', Date.now() - start);

    return containsModifiedMatches ? [] : alignedMatches;

  }


}