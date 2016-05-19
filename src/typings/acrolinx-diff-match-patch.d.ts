/// <reference path="./diff-match-patch.d.ts" />

declare module acrolinx.diffMatchPatch {
  export class DiffMatchPatch extends diff_match_patch {
    constructor();
  }
  const DIFF_DELETE: number;
  const DIFF_INSERT: number;
  const DIFF_EQUAL: number;
}