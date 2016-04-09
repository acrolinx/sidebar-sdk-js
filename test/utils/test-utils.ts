namespace  acrolinx.test.utils {
  export function getMatchesWithReplacement(completeString: string, partialString: string, replacement: string): MatchWithReplacement[] {
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

}