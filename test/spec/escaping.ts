import {assertDeepEqual} from "../utils/test-utils";
import {escapeHtmlCharacters} from "../../src/utils/escaping";
import {findNewIndex} from "../../src/utils/alignment";
import assert = chai.assert;


const JS_VERIFY_OPTS = {
  tests: 1000,
  rngState: '0123456789abcdef01'
};


function findIndices(char: string, text: string) {
  const indices: number[] = [];
  for (var i = 0; i < text.length; i++) {
    if (text[i] === char) {
      indices.push(i);
    }
  }
  return indices;
}

/**
 * Test if position of the needles are mapped correctly back.
 */
function assertBackwardMappingIsCorrect(text: string, needle = '!') {
  const originalIndices = findIndices(needle, text);
  const result = escapeHtmlCharacters(text);
  const escapedIndices = findIndices(needle, result.escapedText);
  const mappedBackIndices = escapedIndices.map((i) => findNewIndex(result.backwardAlignment, i));
  assertDeepEqual(mappedBackIndices, originalIndices);
  return true;
}

describe('escapeHtmlCharacters', function () {
  // this.timeout(20000);

  it('empty text', () => {
    const result = escapeHtmlCharacters('');
    assert.equal(result.escapedText, '');
    assertDeepEqual(result.backwardAlignment, []);
  });

  it('text without html characters', () => {
    const text = 'text';
    const result = escapeHtmlCharacters(text);
    assert.equal(result.escapedText, text);
    assertDeepEqual(result.backwardAlignment, []);
  });

  it('text with one html characters', () => {
    const text = '012<456';
    const result = escapeHtmlCharacters(text);

    const escapedText = '012&lt;456';
    assert.equal(result.escapedText, escapedText);

    assertDeepEqual(result.backwardAlignment, [
      {oldPosition: escapedText.indexOf('4'), diffOffset: -3}
    ]);
  });

  it('text with two html characters', () => {
    const text = '012<4&67';
    const result = escapeHtmlCharacters(text);

    const escapedText = '012&lt;4&amp;67';
    assert.equal(result.escapedText, escapedText);

    assertDeepEqual(result.backwardAlignment, [
      {oldPosition: escapedText.indexOf('4'), diffOffset: -3},
      {oldPosition: escapedText.indexOf('6'), diffOffset: -7}
    ]);
  });

  describe('backwardAlignment', () => {
    it('empty texts', () => {
      assertBackwardMappingIsCorrect('');
    });

    it('one html character', () => {
      assertBackwardMappingIsCorrect('012<!56');
      assertBackwardMappingIsCorrect('!!!<!!!');
    });

    it('two html characters', () => {
      assertBackwardMappingIsCorrect('0<!&!5');
      assertBackwardMappingIsCorrect('&<!');
    });

    it('wild html characters', () => {
      const wild = '&!<!>!"!\'!`!';
      assert.equal(_.escape(wild), escapeHtmlCharacters(wild).escapedText);
      assertBackwardMappingIsCorrect(wild);
    });

    it('random texts', () => {
      jsc.assert(jsc.forall("string", (text: string) => {
          const textWithNeedles = text.replace(/(.)/g, '$1!');
          return assertBackwardMappingIsCorrect(textWithNeedles);
        }
      ), JS_VERIFY_OPTS);
    });

  });

  it('escapedText is identical result of _.escape', () => {
    jsc.assert(jsc.forall("string",
      (text: string) => _.escape(text) === escapeHtmlCharacters(text).escapedText
    ), JS_VERIFY_OPTS);
  });

});


