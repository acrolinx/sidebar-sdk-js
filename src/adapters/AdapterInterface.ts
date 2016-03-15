namespace acrolinx.plugins.adapter {
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
    replaceRanges(checkId, matchesWithReplacement);
  }
}

