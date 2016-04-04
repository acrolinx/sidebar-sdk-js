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

namespace acrolinx.plugins.lookup.diffbased {
  'use strict';

  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;
  import _ = acrolinxLibs._;

  /**
   */
  export function lookupMatches(checkedDocument: string, currentDocument: string, matches: MatchWithReplacement[]): AlignedMatch[] {
    return matches.map(match => ({
      replacement: match.replacement,
      range: match.range,
      content: match.content,
      foundOffset: match.range[0],
      // This -1 seems to be wrong, but the current code in the adapters want it this way.
      flagLength: match.range[1] - match.range[0] - 1,
    }));
  }

}