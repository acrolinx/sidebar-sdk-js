namespace acrolinx.plugins.lookup {
  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  export interface AlignedMatch extends MatchWithReplacement {
    foundOffset: number;
    flagLength: number;
  }

  export type LookupMatchesFunction =  (checkedDocument: string, currentDocument: string, matches: MatchWithReplacement[]) => AlignedMatch[];
}
