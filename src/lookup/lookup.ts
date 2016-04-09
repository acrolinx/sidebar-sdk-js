namespace acrolinx.plugins.lookup {
  import Match = acrolinx.sidebar.Match;

  export interface AlignedMatch<T extends Match> {
    originalMatch: T;
    foundOffset: number;
    foundEnd: number;
    flagLength: number;
  }

}
