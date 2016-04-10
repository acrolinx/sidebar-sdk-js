namespace acrolinx.plugins.adapter {
  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import Match = acrolinx.sidebar.Match;
  import Check = acrolinx.sidebar.Check;
  import CheckResult = acrolinx.sidebar.CheckResult;

  export interface AdapterConf {
    editorId: string;
  }

  export interface AdapterInterface {
    getEditor?() : any;
    getFormat?(): string;
    getDocumentReference?(): string;
    getHTML?(): string;
    extractHTMLForCheck() : HtmlResult | Promise<HtmlResult>;
    registerCheckCall(checkInfo: Check) : void;
    registerCheckResult(checkResult: CheckResult): void;
    selectRanges(checkId: string, matches: Match[]) : void;
    replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) : void;
  }
}

