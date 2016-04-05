var assert = chai.assert;
var expect = chai.expect;

namespace acrolinx.test {

  import  lookupMatches = acrolinx.plugins.lookup.diffbased.lookupMatches;
  import  createOffsetMappingArray = acrolinx.plugins.lookup.diffbased.createOffsetMappingArray;

  describe('lookup/diff-based', function () {
    it('createOffsetMappingArray', function () {
      const diffs = JsDiff.diffChars('abcde', 'zabxcye');
      // console.log(diffs);
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

      // console.log(JSON.stringify(offsetMapping));
      assert.deepEqual(offsetMapping, expected);
    });

    it('lookupMatches returns empty array for empty input array', function () {
      lookupMatches('abcd', 'zabxcy', []);
    });

  });
}
