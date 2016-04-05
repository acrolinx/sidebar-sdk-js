var assert = chai.assert;
var expect = chai.expect;

namespace acrolinx.test {

  import  lookupMatches = acrolinx.plugins.lookup.diffbased.lookupMatches;

  describe('lookup/diff-based', function () {

    it('lookupMatches', function () {
      lookupMatches('abcd', 'zabxcy', []);
    });

  });
}
