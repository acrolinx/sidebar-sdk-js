namespace acrolinx.plugins.lookup {
  import Match = acrolinx.sidebar.Match;

  export interface AlignedMatch<T extends Match> {
    originalMatch: T;
    range: [number, number];
  }

}
