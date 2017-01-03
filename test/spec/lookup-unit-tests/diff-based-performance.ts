import {createOffsetMappingArray} from "../../../src/lookup/diff-based";
import {diff_match_patch} from "diff-match-patch";
const assert = chai.assert;


function generateText(length: number) {
  const chars = '      abcdefghijcmnopqrstuvwxyz';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += chars[Math.floor(Math.random() * chars.length)];
  }
  return text;
}

function modifyTextRandomly(originalText: string, modifications: number) {
  let currentText = originalText;
  for (let i = 0; i < modifications; i++) {
    const insertPosition = Math.floor(Math.random() * currentText.length);
    currentText = currentText.slice(0, insertPosition) + generateText(5) + currentText.slice(insertPosition);
  }
  return currentText;
}


describe('lookup/diff-based-performance', function () {

  it('is fast', function () {

    const text1 = generateText(100000);
    const text2 = modifyTextRandomly(text1, 100);

    const startTime = Date.now();

    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(text1, text2);
    createOffsetMappingArray(diffs);

    const neededTimeMs = Date.now() - startTime;
    assert.isTrue(neededTimeMs < 20000);

  });
});
