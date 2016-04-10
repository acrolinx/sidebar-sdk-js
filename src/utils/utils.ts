namespace acrolinx.plugins.utils {
  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;
  import Match = acrolinx.sidebar.Match;

  export function logTime(text: string, f: Function) {
    const startTime = Date.now();
    const result = f();
    console.log(`Duration of "${text}:"`, Date.now() - startTime);
    return result;
  }

  export function getCompleteFlagLength<T extends Match>(matches: AlignedMatch<T>[]) {
    return matches[matches.length - 1].range[1] - matches[0].range[0];
  }
}