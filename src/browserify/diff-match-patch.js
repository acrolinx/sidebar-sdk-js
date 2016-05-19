(function (acrolinx) {
  var dmpModule = require('diff-match-patch');
  acrolinx.diffMatchPatch = {
    DiffMatchPatch: dmpModule.diff_match_patch,
    DIFF_DELETE: dmpModule.DIFF_DELETE,
    DIFF_INSERT: dmpModule.DIFF_INSERT,
    DIFF_EQUAL: dmpModule.DIFF_EQUAL
  };
})(acrolinx || (acrolinx = {}));
