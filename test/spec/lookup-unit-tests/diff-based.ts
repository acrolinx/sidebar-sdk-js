var assert = chai.assert;
var expect = chai.expect;

namespace acrolinx.test {
  import  lookupMatches = acrolinx.plugins.lookup.diffbased.lookupMatches;
  import  createOffsetMappingArray = acrolinx.plugins.lookup.diffbased.createOffsetMappingArray;

  describe('lookup/diff-based', function () {
    it('createOffsetMappingArray', function () {
      const dmp = new acrolinx.diffMatchPatch.DiffMatchPatch();
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


}
