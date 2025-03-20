import _ from 'lodash';
import { describe, expect, it } from 'vitest';
import { findNewIndex } from '../../src/utils/alignment';
import { escapeHtmlCharacters } from '../../src/utils/escaping';
import fc from 'fast-check';

const JS_VERIFY_OPTS = {
  tests: 1000,
  rngState: '0123456789abcdef01',
};

const FAST_CHECK_OPTS = {
  numRuns: JS_VERIFY_OPTS.tests,
  seed: parseInt(JS_VERIFY_OPTS.rngState, 16),
};

function findIndices(char: string, text: string) {
  const indices: number[] = [];
  for (let i = 0; i < text.length; i++) {
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

  expect(mappedBackIndices).toEqual(originalIndices);
  return true;
}

describe('escapeHtmlCharacters', function () {
  // this.timeout(20000);

  it('empty text', () => {
    const result = escapeHtmlCharacters('');
    expect(result.escapedText).toBe('');
    expect(result.backwardAlignment).toEqual([]);
  });

  it('text without html characters', () => {
    const text = 'text';
    const result = escapeHtmlCharacters(text);
    expect(result.escapedText).toBe(text);

    expect(result.backwardAlignment).toEqual([]);
  });

  it('text with one html characters', () => {
    const text = '012<456';
    const result = escapeHtmlCharacters(text);

    const escapedText = '012&lt;456';
    expect(result.escapedText).toBe(escapedText);

    expect(result.backwardAlignment).toEqual([{ oldPosition: escapedText.indexOf('4'), diffOffset: -3 }]);
  });

  it('text with two html characters', () => {
    const text = '012<4&67';
    const result = escapeHtmlCharacters(text);

    const escapedText = '012&lt;4&amp;67';
    expect(result.escapedText).toBe(escapedText);

    expect(result.backwardAlignment).toEqual([
      { oldPosition: escapedText.indexOf('4'), diffOffset: -3 },
      { oldPosition: escapedText.indexOf('6'), diffOffset: -7 },
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
      expect(escapeHtmlCharacters(wild).escapedText).toBe('&amp;!&lt;!&gt;!&quot;!&#39;!&#96;!');
      assertBackwardMappingIsCorrect(wild);
    });

    it('random texts', () => {
      fc.assert(
        fc.property(fc.string(), (text: string) => {
          const textWithNeedles = text.replace(/(.)/g, '$1!');
          return assertBackwardMappingIsCorrect(textWithNeedles);
        }),
        FAST_CHECK_OPTS,
      );
    });

    // TODO lodash escape not identical for "`"
    it.skip('escapedText is identical result of _.escape', () => {
      fc.assert(
        fc.property(fc.string(), (text: string) => {
          return _.escape(text) === escapeHtmlCharacters(text).escapedText;
        }),
        FAST_CHECK_OPTS,
      );
    });
  });
});
