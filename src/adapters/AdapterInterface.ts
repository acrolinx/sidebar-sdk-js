namespace acrolinx.plugins.adapter {
  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import Match = acrolinx.sidebar.Match;
  import Check = acrolinx.sidebar.Check;
  import CheckResult = acrolinx.sidebar.CheckResult;


  interface CommonAdapterConf {
    scrollOffsetY?: number;
  }

  export interface HasEditorID extends CommonAdapterConf {
    editorId: string;
  }

  interface HasElement extends CommonAdapterConf {
    element: HTMLElement;
  }

  export type AdapterConf = HasEditorID | HasElement;

  export interface AdapterInterface {
    getEditor?(): any;
    getFormat?(): string;
    getDocumentReference?(): string;
    getHTML?(): string;
    extractHTMLForCheck(): HtmlResult | Promise<HtmlResult>;
    registerCheckCall(checkInfo: Check): void;
    registerCheckResult(checkResult: CheckResult): void;
    selectRanges(checkId: string, matches: Match[]): void;
    replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): void;
  }

  export function isHasEditorID(a: AdapterConf): a is HasEditorID {
    return !!(a as HasEditorID).editorId;
  }

  export function getElementFromAdapterConf(conf: AdapterConf) {
    if (isHasEditorID(conf)) {
      return document.getElementById(conf.editorId) as HTMLElement;
    } else {
      return conf.element;
    }
  }

}

