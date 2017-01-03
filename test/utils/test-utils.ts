const assert = chai.assert;

import {MatchWithReplacement} from '../../src/acrolinx-libs/plugin-interfaces';

export function getMatchesWithReplacement(completeString: string, partialString: string, replacement = ''): MatchWithReplacement[] {
  const matches: MatchWithReplacement[] = [];
  let offsetStart: number;
  let offsetEnd = 0;
  while (true) {
    offsetStart = completeString.indexOf(partialString, offsetEnd);

    if (offsetStart == -1) {
      break;
    }

    offsetEnd = offsetStart + partialString.length;

    matches.push({
      content: partialString,
      replacement: replacement,
      range: [offsetStart, offsetEnd]
    });
  }
  return matches;
}

export function assertDeepEqual<T>(val: T, expected: T) {
  assert.equal(JSON.stringify(val), JSON.stringify(expected));
}
