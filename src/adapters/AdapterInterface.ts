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


export interface ContentExtractionResult {
  content?: string;
  error?: any;
  documentReference?: string;
}

export interface AdapterInterface {
  getEditor?(): any;
  getFormat?(): string;

  /**
   * @deprecated Use the attribute documentReference in ContentExtractionResult.
   */
  getDocumentReference?(): string;

  getContent?(): string;
  extractContentForCheck(): ContentExtractionResult | Promise<ContentExtractionResult>;
  registerCheckCall(checkInfo: Check): void;
  registerCheckResult(checkResult: CheckResult): void;
  selectRanges(checkId: string, matches: Match[]): void;
  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): void;
}

export function hasEditorID(a: AdapterConf): a is HasEditorID {
  return !!(a as HasEditorID).editorId;
}

export function hasElement(a: AdapterConf): a is HasElement {
  return !!(a as HasElement).element;
}

export function getElementFromAdapterConf(conf: AdapterConf) {
  if (hasElement(conf)) {
    return conf.element;
  } else if (hasEditorID(conf)) {
    return document.getElementById(conf.editorId) as HTMLElement;
  } else {
    console.error('Invalid AdapterConf. Missing editorId or element', conf);
    throw new Error('Invalid AdapterConf. Missing editorId or element');
  }
}


