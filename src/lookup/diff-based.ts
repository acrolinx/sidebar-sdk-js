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

/// <reference path="../typings/diff.d.ts" />

namespace acrolinx.plugins.lookup.diffbased {
  'use strict';

  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;
  import _ = acrolinxLibs._;

  class OffSetAlign {
    oldPosition: number
    diffOffset: number
  }
  /**
   */
  export function lookupMatches(checkedDocument: string, currentDocument: string, matches: MatchWithReplacement[]): AlignedMatch[] {
    console.log(JsDiff.diffChars(checkedDocument, currentDocument));
    const diffs = JsDiff.diffChars(checkedDocument, currentDocument);
    let offsetCountOld = 0;
    let diff = 0;
    //TODO: cannot define this as array OffSetAlign[]
    let offsetMappingArray: any = new Array();
    diffs.forEach(function(object){
      if(!object.added && !object.removed){
        offsetCountOld += object.count;
      }
      else if (object.removed) {
        offsetCountOld += object.count;
        diff -= object.count;
      }
      else if (object.added) {
        diff += object.count;
      }
      console.log(offsetCountOld);
      console.log(diff);
        offsetMappingArray.push({
          oldPosition: offsetCountOld,
          diffOffset: diff
        })
    });
    console.log(offsetMappingArray);

    function findNewOffset(oldOffset: number){
        let index = offsetMappingArray.findIndex(function(element, index, array){
        console.log(element.oldPosition, oldOffset);
        return element.oldPosition > oldOffset
      });
      if(index > 0){
        console.log('foundOffsetDiffIndex', index);
        return offsetMappingArray[index-1].diffOffset;
      }
      else if(offsetMappingArray.length > 1 && index === -1) {
        if(!diffs[offsetMappingArray.length -1].added && !diffs[offsetMappingArray.length-1].removed){
          return offsetMappingArray[offsetMappingArray.length -1].diffOffset;
        }
        return offsetMappingArray[offsetMappingArray.length -2].diffOffset;
      }
      else if(index === 0){
        return offsetMappingArray[0].diffOffset;
      }
      else return 0;
    }

    return matches.map(match => ({
      replacement: match.replacement,
      range: match.range,
      content: match.content,
      foundOffset: match.range[0] + findNewOffset(match.range[0]),
      // This -1 seems to be wrong, but the current code in the adapters want it this way.
      flagLength: match.range[1] - match.range[0] - 1,
    }));
  }

}