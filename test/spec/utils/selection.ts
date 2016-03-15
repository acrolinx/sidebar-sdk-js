var assert = chai.assert;
var expect = chai.expect;

describe('utils/selection', function () {
  var selectionUtils = acrolinx.plugins.utils.selection;

  it('isAlphaNumeral', function () {
    assert.equal(selectionUtils.isAlphaNumeral('a'), true);
    assert.equal(selectionUtils.isAlphaNumeral('A'), true);
    assert.equal(selectionUtils.isAlphaNumeral('1'), true);
    assert.equal(selectionUtils.isAlphaNumeral('!'), false);
  });

});
