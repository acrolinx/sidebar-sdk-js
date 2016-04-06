var assert = chai.assert;
var expect = chai.expect;

/// <reference path="../../../src/typings/diff.d.ts" />

namespace acrolinx.test {

  import  lookupMatches = acrolinx.plugins.lookup.diffbased.lookupMatches;
  import  createOffsetMappingArray = acrolinx.plugins.lookup.diffbased.createOffsetMappingArray;

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

  });
}
