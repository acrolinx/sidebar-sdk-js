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

  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;
  import _ = acrolinxLibs._;

  const dmp = new diff_match_patch();

  interface OffSetAlign {
    oldPosition: number
    diffOffset: number
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

  type InputFormat = 'HTML' | 'TEXT';

  export function lookupMatches(checkedDocument: string, currentDocument: string,
                                matches: MatchWithReplacement[], inputFormat: InputFormat = 'HTML'): AlignedMatch[] {
    if (_.isEmpty(matches)) {
      return [];
    }
    // const start = Date.now();
    const cleanedCheckedDocument = inputFormat === 'HTML' ? replaceTags(checkedDocument) : checkedDocument;
    const diffs: Diff[] = dmp.diff_main(cleanedCheckedDocument, currentDocument);

    // console.log(diffs);

    let offsetMappingArray = createOffsetMappingArray(diffs);

    function findNewOffset(oldOffset: number) {
      let index = _.findIndex(offsetMappingArray, (element) => {
        return element.oldPosition > oldOffset
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

    const result = matches.map(match => {

      const foundOffset = match.range[0] + findNewOffset(match.range[0]);
      const foundEnd = match.range[1] + findNewOffset(match.range[1]);
      return {
        replacement: match.replacement,
        range: match.range,
        content: match.content,
        foundOffset,
        foundEnd,
        flagLength: foundEnd - foundOffset,
      }
    });

    // console.log('Time for Diffing: ', Date.now() - start);

    result[0].flagLength = result[matches.length - 1].foundEnd - result[0].foundOffset;
    return result;
  }


}