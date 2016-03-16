namespace acrolinx.plugins.adapter {
  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  export interface AdapterInterface {
    selectText(begin: number, length: number);
    findRangesPositionInPlainText?(text, matches);
    getEditor?();
    getEditorElement?();
    getCurrentText() : string;
    getHTML() : string;
    extractHTMLForCheck();
    registerCheckCall(checkInfo);
    registerCheckResult(checkResult)
    selectRanges(checkId, matches);
    replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]);
  }
}

