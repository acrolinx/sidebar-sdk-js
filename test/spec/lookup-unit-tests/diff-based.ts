var assert = chai.assert;
var expect = chai.expect;

/// <reference path="../../../src/typings/diff.d.ts" />

namespace acrolinx.test {

  import  lookupMatches = acrolinx.plugins.lookup.diffbased.lookupMatches;
  import  replaceTags = acrolinx.plugins.lookup.diffbased.replaceTags;
  import  findNewOffsetSimple = acrolinx.plugins.lookup.diffbased.findNewOffset;
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

    it('return empty array if content at match has changed', function () {
      const text = 'errorr';
      const alignedMatches = lookupMatches(text, 'error', getMatchesWithReplacement(text, 'errorr'));
      assert.deepEqual(alignedMatches, []);
    });

    describe('replaceTags', () => {
      it('2 tags', () => {
        const html = '01<t/>67<li/>34';
        const [text, offsetMapping] = replaceTags(html);

        assert.equal(text, '016734');

        assert.equal(findNewOffsetSimple(offsetMapping, 0), 0);
        assert.equal(findNewOffsetSimple(offsetMapping, 1), 0);
        assert.equal(findNewOffsetSimple(offsetMapping, 6), -4);
        assert.equal(findNewOffsetSimple(offsetMapping, 7), -4);
        assert.equal(findNewOffsetSimple(offsetMapping, 13), -9);
        assert.equal(findNewOffsetSimple(offsetMapping, 14), -9);
      });
    });
  });


}
