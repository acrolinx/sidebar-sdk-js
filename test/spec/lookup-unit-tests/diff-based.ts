/*
 * Copyright 2016-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {createOffsetMappingArray, lookupMatches} from "../../../src/lookup/diff-based";
import {diff_match_patch} from "diff-match-patch";
import {getMatchesWithReplacement} from "../../utils/test-utils";
const assert = chai.assert;


describe('lookup/diff-based', function () {
  it('createOffsetMappingArray', function () {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main('abcde', 'zabxcye');
    const offsetMapping = createOffsetMappingArray(diffs);
    const expected = [
      {"oldPosition": 0, "diffOffset": 1},
      {"oldPosition": 2, "diffOffset": 1},
      {"oldPosition": 2, "diffOffset": 2},
      {"oldPosition": 3, "diffOffset": 2},
      {"oldPosition": 4, "diffOffset": 1},
      {"oldPosition": 4, "diffOffset": 2},
      {"oldPosition": 5, "diffOffset": 2}
    ];

    assert.deepEqual(offsetMapping, expected);
  });

  it('lookupMatches returns empty array for empty input array', function () {
    lookupMatches('abcd', 'zabxcy', []);
  });

  it('return empty array if content at match has changed', function () {
    const text = 'errorr';
    const alignedMatches = lookupMatches(text, 'error', getMatchesWithReplacement(text, 'errorr'));
    assert.deepEqual(alignedMatches, []);
  });

});


