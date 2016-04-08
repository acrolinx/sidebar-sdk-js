namespace acrolinx.plugins.adapter {
  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import LookupMatchesFunction = acrolinx.plugins.lookup.LookupMatchesFunction;

  export interface AdapterConf {
    editorId: string;
    lookupMatches?: LookupMatchesFunction;
  }

  export interface AdapterInterface {
    findRangesPositionInPlainText?(text, matches);
    getEditor?();
    getHTML() : string;
    extractHTMLForCheck();
    registerCheckCall(checkInfo);
    registerCheckResult(checkResult)
    selectRanges(checkId: string, matches: MatchWithReplacement[]);
    replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]);
  }
}

