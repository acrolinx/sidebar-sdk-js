var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function e(t, n, r) { function s(o, u) { if (!n[o]) {
    if (!t[o]) {
        var a = typeof require == "function" && require;
        if (!u && a)
            return a(o, !0);
        if (i)
            return i(o, !0);
        var f = new Error("Cannot find module '" + o + "'");
        throw f.code = "MODULE_NOT_FOUND", f;
    }
    var l = n[o] = { exports: {} };
    t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e); }, l, l.exports, e, t, n, r);
} return n[o].exports; } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++)
    s(r[o]); return s; })({ 1: [function (require, module, exports) {
            'use strict';
            function diff_match_patch() {
                this.Diff_Timeout = 1.0;
                this.Diff_EditCost = 4;
                this.Match_Threshold = 0.5;
                this.Match_Distance = 1000;
                this.Patch_DeleteThreshold = 0.5;
                this.Patch_Margin = 4;
                this.Match_MaxBits = 32;
            }
            var DIFF_DELETE = -1;
            var DIFF_INSERT = 1;
            var DIFF_EQUAL = 0;
            diff_match_patch.Diff;
            diff_match_patch.prototype.diff_main = function (text1, text2, opt_checklines, opt_deadline) {
                if (typeof opt_deadline == 'undefined') {
                    if (this.Diff_Timeout <= 0) {
                        opt_deadline = Number.MAX_VALUE;
                    }
                    else {
                        opt_deadline = (new Date).getTime() + this.Diff_Timeout * 1000;
                    }
                }
                var deadline = opt_deadline;
                if (text1 == null || text2 == null) {
                    throw new Error('Null input. (diff_main)');
                }
                if (text1 == text2) {
                    if (text1) {
                        return [[DIFF_EQUAL, text1]];
                    }
                    return [];
                }
                if (typeof opt_checklines == 'undefined') {
                    opt_checklines = true;
                }
                var checklines = opt_checklines;
                var commonlength = this.diff_commonPrefix(text1, text2);
                var commonprefix = text1.substring(0, commonlength);
                text1 = text1.substring(commonlength);
                text2 = text2.substring(commonlength);
                commonlength = this.diff_commonSuffix(text1, text2);
                var commonsuffix = text1.substring(text1.length - commonlength);
                text1 = text1.substring(0, text1.length - commonlength);
                text2 = text2.substring(0, text2.length - commonlength);
                var diffs = this.diff_compute_(text1, text2, checklines, deadline);
                if (commonprefix) {
                    diffs.unshift([DIFF_EQUAL, commonprefix]);
                }
                if (commonsuffix) {
                    diffs.push([DIFF_EQUAL, commonsuffix]);
                }
                this.diff_cleanupMerge(diffs);
                return diffs;
            };
            diff_match_patch.prototype.diff_compute_ = function (text1, text2, checklines, deadline) {
                var diffs;
                if (!text1) {
                    return [[DIFF_INSERT, text2]];
                }
                if (!text2) {
                    return [[DIFF_DELETE, text1]];
                }
                var longtext = text1.length > text2.length ? text1 : text2;
                var shorttext = text1.length > text2.length ? text2 : text1;
                var i = longtext.indexOf(shorttext);
                if (i != -1) {
                    diffs = [[DIFF_INSERT, longtext.substring(0, i)],
                        [DIFF_EQUAL, shorttext],
                        [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
                    if (text1.length > text2.length) {
                        diffs[0][0] = diffs[2][0] = DIFF_DELETE;
                    }
                    return diffs;
                }
                if (shorttext.length == 1) {
                    return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
                }
                var hm = this.diff_halfMatch_(text1, text2);
                if (hm) {
                    var text1_a = hm[0];
                    var text1_b = hm[1];
                    var text2_a = hm[2];
                    var text2_b = hm[3];
                    var mid_common = hm[4];
                    var diffs_a = this.diff_main(text1_a, text2_a, checklines, deadline);
                    var diffs_b = this.diff_main(text1_b, text2_b, checklines, deadline);
                    return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
                }
                if (checklines && text1.length > 100 && text2.length > 100) {
                    return this.diff_lineMode_(text1, text2, deadline);
                }
                return this.diff_bisect_(text1, text2, deadline);
            };
            diff_match_patch.prototype.diff_lineMode_ = function (text1, text2, deadline) {
                var a = this.diff_linesToChars_(text1, text2);
                text1 = a.chars1;
                text2 = a.chars2;
                var linearray = a.lineArray;
                var diffs = this.diff_main(text1, text2, false, deadline);
                this.diff_charsToLines_(diffs, linearray);
                this.diff_cleanupSemantic(diffs);
                diffs.push([DIFF_EQUAL, '']);
                var pointer = 0;
                var count_delete = 0;
                var count_insert = 0;
                var text_delete = '';
                var text_insert = '';
                while (pointer < diffs.length) {
                    switch (diffs[pointer][0]) {
                        case DIFF_INSERT:
                            count_insert++;
                            text_insert += diffs[pointer][1];
                            break;
                        case DIFF_DELETE:
                            count_delete++;
                            text_delete += diffs[pointer][1];
                            break;
                        case DIFF_EQUAL:
                            if (count_delete >= 1 && count_insert >= 1) {
                                diffs.splice(pointer - count_delete - count_insert, count_delete + count_insert);
                                pointer = pointer - count_delete - count_insert;
                                var a = this.diff_main(text_delete, text_insert, false, deadline);
                                for (var j = a.length - 1; j >= 0; j--) {
                                    diffs.splice(pointer, 0, a[j]);
                                }
                                pointer = pointer + a.length;
                            }
                            count_insert = 0;
                            count_delete = 0;
                            text_delete = '';
                            text_insert = '';
                            break;
                    }
                    pointer++;
                }
                diffs.pop();
                return diffs;
            };
            diff_match_patch.prototype.diff_bisect_ = function (text1, text2, deadline) {
                var text1_length = text1.length;
                var text2_length = text2.length;
                var max_d = Math.ceil((text1_length + text2_length) / 2);
                var v_offset = max_d;
                var v_length = 2 * max_d;
                var v1 = new Array(v_length);
                var v2 = new Array(v_length);
                for (var x = 0; x < v_length; x++) {
                    v1[x] = -1;
                    v2[x] = -1;
                }
                v1[v_offset + 1] = 0;
                v2[v_offset + 1] = 0;
                var delta = text1_length - text2_length;
                var front = (delta % 2 != 0);
                var k1start = 0;
                var k1end = 0;
                var k2start = 0;
                var k2end = 0;
                for (var d = 0; d < max_d; d++) {
                    if ((new Date()).getTime() > deadline) {
                        break;
                    }
                    for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
                        var k1_offset = v_offset + k1;
                        var x1;
                        if (k1 == -d || (k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
                            x1 = v1[k1_offset + 1];
                        }
                        else {
                            x1 = v1[k1_offset - 1] + 1;
                        }
                        var y1 = x1 - k1;
                        while (x1 < text1_length && y1 < text2_length &&
                            text1.charAt(x1) == text2.charAt(y1)) {
                            x1++;
                            y1++;
                        }
                        v1[k1_offset] = x1;
                        if (x1 > text1_length) {
                            k1end += 2;
                        }
                        else if (y1 > text2_length) {
                            k1start += 2;
                        }
                        else if (front) {
                            var k2_offset = v_offset + delta - k1;
                            if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
                                var x2 = text1_length - v2[k2_offset];
                                if (x1 >= x2) {
                                    return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
                                }
                            }
                        }
                    }
                    for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
                        var k2_offset = v_offset + k2;
                        var x2;
                        if (k2 == -d || (k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
                            x2 = v2[k2_offset + 1];
                        }
                        else {
                            x2 = v2[k2_offset - 1] + 1;
                        }
                        var y2 = x2 - k2;
                        while (x2 < text1_length && y2 < text2_length &&
                            text1.charAt(text1_length - x2 - 1) ==
                                text2.charAt(text2_length - y2 - 1)) {
                            x2++;
                            y2++;
                        }
                        v2[k2_offset] = x2;
                        if (x2 > text1_length) {
                            k2end += 2;
                        }
                        else if (y2 > text2_length) {
                            k2start += 2;
                        }
                        else if (!front) {
                            var k1_offset = v_offset + delta - k2;
                            if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
                                var x1 = v1[k1_offset];
                                var y1 = v_offset + x1 - k1_offset;
                                x2 = text1_length - x2;
                                if (x1 >= x2) {
                                    return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
                                }
                            }
                        }
                    }
                }
                return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
            };
            diff_match_patch.prototype.diff_bisectSplit_ = function (text1, text2, x, y, deadline) {
                var text1a = text1.substring(0, x);
                var text2a = text2.substring(0, y);
                var text1b = text1.substring(x);
                var text2b = text2.substring(y);
                var diffs = this.diff_main(text1a, text2a, false, deadline);
                var diffsb = this.diff_main(text1b, text2b, false, deadline);
                return diffs.concat(diffsb);
            };
            diff_match_patch.prototype.diff_linesToChars_ = function (text1, text2) {
                var lineArray = [];
                var lineHash = {};
                lineArray[0] = '';
                function diff_linesToCharsMunge_(text) {
                    var chars = '';
                    var lineStart = 0;
                    var lineEnd = -1;
                    var lineArrayLength = lineArray.length;
                    while (lineEnd < text.length - 1) {
                        lineEnd = text.indexOf('\n', lineStart);
                        if (lineEnd == -1) {
                            lineEnd = text.length - 1;
                        }
                        var line = text.substring(lineStart, lineEnd + 1);
                        lineStart = lineEnd + 1;
                        if (lineHash.hasOwnProperty ? lineHash.hasOwnProperty(line) :
                            (lineHash[line] !== undefined)) {
                            chars += String.fromCharCode(lineHash[line]);
                        }
                        else {
                            chars += String.fromCharCode(lineArrayLength);
                            lineHash[line] = lineArrayLength;
                            lineArray[lineArrayLength++] = line;
                        }
                    }
                    return chars;
                }
                var chars1 = diff_linesToCharsMunge_(text1);
                var chars2 = diff_linesToCharsMunge_(text2);
                return { chars1: chars1, chars2: chars2, lineArray: lineArray };
            };
            diff_match_patch.prototype.diff_charsToLines_ = function (diffs, lineArray) {
                for (var x = 0; x < diffs.length; x++) {
                    var chars = diffs[x][1];
                    var text = [];
                    for (var y = 0; y < chars.length; y++) {
                        text[y] = lineArray[chars.charCodeAt(y)];
                    }
                    diffs[x][1] = text.join('');
                }
            };
            diff_match_patch.prototype.diff_commonPrefix = function (text1, text2) {
                if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
                    return 0;
                }
                var pointermin = 0;
                var pointermax = Math.min(text1.length, text2.length);
                var pointermid = pointermax;
                var pointerstart = 0;
                while (pointermin < pointermid) {
                    if (text1.substring(pointerstart, pointermid) ==
                        text2.substring(pointerstart, pointermid)) {
                        pointermin = pointermid;
                        pointerstart = pointermin;
                    }
                    else {
                        pointermax = pointermid;
                    }
                    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
                }
                return pointermid;
            };
            diff_match_patch.prototype.diff_commonSuffix = function (text1, text2) {
                if (!text1 || !text2 ||
                    text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
                    return 0;
                }
                var pointermin = 0;
                var pointermax = Math.min(text1.length, text2.length);
                var pointermid = pointermax;
                var pointerend = 0;
                while (pointermin < pointermid) {
                    if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
                        text2.substring(text2.length - pointermid, text2.length - pointerend)) {
                        pointermin = pointermid;
                        pointerend = pointermin;
                    }
                    else {
                        pointermax = pointermid;
                    }
                    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
                }
                return pointermid;
            };
            diff_match_patch.prototype.diff_commonOverlap_ = function (text1, text2) {
                var text1_length = text1.length;
                var text2_length = text2.length;
                if (text1_length == 0 || text2_length == 0) {
                    return 0;
                }
                if (text1_length > text2_length) {
                    text1 = text1.substring(text1_length - text2_length);
                }
                else if (text1_length < text2_length) {
                    text2 = text2.substring(0, text1_length);
                }
                var text_length = Math.min(text1_length, text2_length);
                if (text1 == text2) {
                    return text_length;
                }
                var best = 0;
                var length = 1;
                while (true) {
                    var pattern = text1.substring(text_length - length);
                    var found = text2.indexOf(pattern);
                    if (found == -1) {
                        return best;
                    }
                    length += found;
                    if (found == 0 || text1.substring(text_length - length) ==
                        text2.substring(0, length)) {
                        best = length;
                        length++;
                    }
                }
            };
            diff_match_patch.prototype.diff_halfMatch_ = function (text1, text2) {
                if (this.Diff_Timeout <= 0) {
                    return null;
                }
                var longtext = text1.length > text2.length ? text1 : text2;
                var shorttext = text1.length > text2.length ? text2 : text1;
                if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
                    return null;
                }
                var dmp = this;
                function diff_halfMatchI_(longtext, shorttext, i) {
                    var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
                    var j = -1;
                    var best_common = '';
                    var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
                    while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
                        var prefixLength = dmp.diff_commonPrefix(longtext.substring(i), shorttext.substring(j));
                        var suffixLength = dmp.diff_commonSuffix(longtext.substring(0, i), shorttext.substring(0, j));
                        if (best_common.length < suffixLength + prefixLength) {
                            best_common = shorttext.substring(j - suffixLength, j) +
                                shorttext.substring(j, j + prefixLength);
                            best_longtext_a = longtext.substring(0, i - suffixLength);
                            best_longtext_b = longtext.substring(i + prefixLength);
                            best_shorttext_a = shorttext.substring(0, j - suffixLength);
                            best_shorttext_b = shorttext.substring(j + prefixLength);
                        }
                    }
                    if (best_common.length * 2 >= longtext.length) {
                        return [best_longtext_a, best_longtext_b,
                            best_shorttext_a, best_shorttext_b, best_common];
                    }
                    else {
                        return null;
                    }
                }
                var hm1 = diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 4));
                var hm2 = diff_halfMatchI_(longtext, shorttext, Math.ceil(longtext.length / 2));
                var hm;
                if (!hm1 && !hm2) {
                    return null;
                }
                else if (!hm2) {
                    hm = hm1;
                }
                else if (!hm1) {
                    hm = hm2;
                }
                else {
                    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
                }
                var text1_a, text1_b, text2_a, text2_b;
                if (text1.length > text2.length) {
                    text1_a = hm[0];
                    text1_b = hm[1];
                    text2_a = hm[2];
                    text2_b = hm[3];
                }
                else {
                    text2_a = hm[0];
                    text2_b = hm[1];
                    text1_a = hm[2];
                    text1_b = hm[3];
                }
                var mid_common = hm[4];
                return [text1_a, text1_b, text2_a, text2_b, mid_common];
            };
            diff_match_patch.prototype.diff_cleanupSemantic = function (diffs) {
                var changes = false;
                var equalities = [];
                var equalitiesLength = 0;
                var lastequality = null;
                var pointer = 0;
                var length_insertions1 = 0;
                var length_deletions1 = 0;
                var length_insertions2 = 0;
                var length_deletions2 = 0;
                while (pointer < diffs.length) {
                    if (diffs[pointer][0] == DIFF_EQUAL) {
                        equalities[equalitiesLength++] = pointer;
                        length_insertions1 = length_insertions2;
                        length_deletions1 = length_deletions2;
                        length_insertions2 = 0;
                        length_deletions2 = 0;
                        lastequality = diffs[pointer][1];
                    }
                    else {
                        if (diffs[pointer][0] == DIFF_INSERT) {
                            length_insertions2 += diffs[pointer][1].length;
                        }
                        else {
                            length_deletions2 += diffs[pointer][1].length;
                        }
                        if (lastequality && (lastequality.length <=
                            Math.max(length_insertions1, length_deletions1)) &&
                            (lastequality.length <= Math.max(length_insertions2, length_deletions2))) {
                            diffs.splice(equalities[equalitiesLength - 1], 0, [DIFF_DELETE, lastequality]);
                            diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
                            equalitiesLength--;
                            equalitiesLength--;
                            pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
                            length_insertions1 = 0;
                            length_deletions1 = 0;
                            length_insertions2 = 0;
                            length_deletions2 = 0;
                            lastequality = null;
                            changes = true;
                        }
                    }
                    pointer++;
                }
                if (changes) {
                    this.diff_cleanupMerge(diffs);
                }
                this.diff_cleanupSemanticLossless(diffs);
                pointer = 1;
                while (pointer < diffs.length) {
                    if (diffs[pointer - 1][0] == DIFF_DELETE &&
                        diffs[pointer][0] == DIFF_INSERT) {
                        var deletion = diffs[pointer - 1][1];
                        var insertion = diffs[pointer][1];
                        var overlap_length1 = this.diff_commonOverlap_(deletion, insertion);
                        var overlap_length2 = this.diff_commonOverlap_(insertion, deletion);
                        if (overlap_length1 >= overlap_length2) {
                            if (overlap_length1 >= deletion.length / 2 ||
                                overlap_length1 >= insertion.length / 2) {
                                diffs.splice(pointer, 0, [DIFF_EQUAL, insertion.substring(0, overlap_length1)]);
                                diffs[pointer - 1][1] =
                                    deletion.substring(0, deletion.length - overlap_length1);
                                diffs[pointer + 1][1] = insertion.substring(overlap_length1);
                                pointer++;
                            }
                        }
                        else {
                            if (overlap_length2 >= deletion.length / 2 ||
                                overlap_length2 >= insertion.length / 2) {
                                diffs.splice(pointer, 0, [DIFF_EQUAL, deletion.substring(0, overlap_length2)]);
                                diffs[pointer - 1][0] = DIFF_INSERT;
                                diffs[pointer - 1][1] =
                                    insertion.substring(0, insertion.length - overlap_length2);
                                diffs[pointer + 1][0] = DIFF_DELETE;
                                diffs[pointer + 1][1] =
                                    deletion.substring(overlap_length2);
                                pointer++;
                            }
                        }
                        pointer++;
                    }
                    pointer++;
                }
            };
            diff_match_patch.prototype.diff_cleanupSemanticLossless = function (diffs) {
                function diff_cleanupSemanticScore_(one, two) {
                    if (!one || !two) {
                        return 6;
                    }
                    var char1 = one.charAt(one.length - 1);
                    var char2 = two.charAt(0);
                    var nonAlphaNumeric1 = char1.match(diff_match_patch.nonAlphaNumericRegex_);
                    var nonAlphaNumeric2 = char2.match(diff_match_patch.nonAlphaNumericRegex_);
                    var whitespace1 = nonAlphaNumeric1 &&
                        char1.match(diff_match_patch.whitespaceRegex_);
                    var whitespace2 = nonAlphaNumeric2 &&
                        char2.match(diff_match_patch.whitespaceRegex_);
                    var lineBreak1 = whitespace1 &&
                        char1.match(diff_match_patch.linebreakRegex_);
                    var lineBreak2 = whitespace2 &&
                        char2.match(diff_match_patch.linebreakRegex_);
                    var blankLine1 = lineBreak1 &&
                        one.match(diff_match_patch.blanklineEndRegex_);
                    var blankLine2 = lineBreak2 &&
                        two.match(diff_match_patch.blanklineStartRegex_);
                    if (blankLine1 || blankLine2) {
                        return 5;
                    }
                    else if (lineBreak1 || lineBreak2) {
                        return 4;
                    }
                    else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
                        return 3;
                    }
                    else if (whitespace1 || whitespace2) {
                        return 2;
                    }
                    else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
                        return 1;
                    }
                    return 0;
                }
                var pointer = 1;
                while (pointer < diffs.length - 1) {
                    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
                        diffs[pointer + 1][0] == DIFF_EQUAL) {
                        var equality1 = diffs[pointer - 1][1];
                        var edit = diffs[pointer][1];
                        var equality2 = diffs[pointer + 1][1];
                        var commonOffset = this.diff_commonSuffix(equality1, edit);
                        if (commonOffset) {
                            var commonString = edit.substring(edit.length - commonOffset);
                            equality1 = equality1.substring(0, equality1.length - commonOffset);
                            edit = commonString + edit.substring(0, edit.length - commonOffset);
                            equality2 = commonString + equality2;
                        }
                        var bestEquality1 = equality1;
                        var bestEdit = edit;
                        var bestEquality2 = equality2;
                        var bestScore = diff_cleanupSemanticScore_(equality1, edit) +
                            diff_cleanupSemanticScore_(edit, equality2);
                        while (edit.charAt(0) === equality2.charAt(0)) {
                            equality1 += edit.charAt(0);
                            edit = edit.substring(1) + equality2.charAt(0);
                            equality2 = equality2.substring(1);
                            var score = diff_cleanupSemanticScore_(equality1, edit) +
                                diff_cleanupSemanticScore_(edit, equality2);
                            if (score >= bestScore) {
                                bestScore = score;
                                bestEquality1 = equality1;
                                bestEdit = edit;
                                bestEquality2 = equality2;
                            }
                        }
                        if (diffs[pointer - 1][1] != bestEquality1) {
                            if (bestEquality1) {
                                diffs[pointer - 1][1] = bestEquality1;
                            }
                            else {
                                diffs.splice(pointer - 1, 1);
                                pointer--;
                            }
                            diffs[pointer][1] = bestEdit;
                            if (bestEquality2) {
                                diffs[pointer + 1][1] = bestEquality2;
                            }
                            else {
                                diffs.splice(pointer + 1, 1);
                                pointer--;
                            }
                        }
                    }
                    pointer++;
                }
            };
            diff_match_patch.nonAlphaNumericRegex_ = /[^a-zA-Z0-9]/;
            diff_match_patch.whitespaceRegex_ = /\s/;
            diff_match_patch.linebreakRegex_ = /[\r\n]/;
            diff_match_patch.blanklineEndRegex_ = /\n\r?\n$/;
            diff_match_patch.blanklineStartRegex_ = /^\r?\n\r?\n/;
            diff_match_patch.prototype.diff_cleanupEfficiency = function (diffs) {
                var changes = false;
                var equalities = [];
                var equalitiesLength = 0;
                var lastequality = null;
                var pointer = 0;
                var pre_ins = false;
                var pre_del = false;
                var post_ins = false;
                var post_del = false;
                while (pointer < diffs.length) {
                    if (diffs[pointer][0] == DIFF_EQUAL) {
                        if (diffs[pointer][1].length < this.Diff_EditCost &&
                            (post_ins || post_del)) {
                            equalities[equalitiesLength++] = pointer;
                            pre_ins = post_ins;
                            pre_del = post_del;
                            lastequality = diffs[pointer][1];
                        }
                        else {
                            equalitiesLength = 0;
                            lastequality = null;
                        }
                        post_ins = post_del = false;
                    }
                    else {
                        if (diffs[pointer][0] == DIFF_DELETE) {
                            post_del = true;
                        }
                        else {
                            post_ins = true;
                        }
                        if (lastequality && ((pre_ins && pre_del && post_ins && post_del) ||
                            ((lastequality.length < this.Diff_EditCost / 2) &&
                                (pre_ins + pre_del + post_ins + post_del) == 3))) {
                            diffs.splice(equalities[equalitiesLength - 1], 0, [DIFF_DELETE, lastequality]);
                            diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
                            equalitiesLength--;
                            lastequality = null;
                            if (pre_ins && pre_del) {
                                post_ins = post_del = true;
                                equalitiesLength = 0;
                            }
                            else {
                                equalitiesLength--;
                                pointer = equalitiesLength > 0 ?
                                    equalities[equalitiesLength - 1] : -1;
                                post_ins = post_del = false;
                            }
                            changes = true;
                        }
                    }
                    pointer++;
                }
                if (changes) {
                    this.diff_cleanupMerge(diffs);
                }
            };
            diff_match_patch.prototype.diff_cleanupMerge = function (diffs) {
                diffs.push([DIFF_EQUAL, '']);
                var pointer = 0;
                var count_delete = 0;
                var count_insert = 0;
                var text_delete = '';
                var text_insert = '';
                var commonlength;
                while (pointer < diffs.length) {
                    switch (diffs[pointer][0]) {
                        case DIFF_INSERT:
                            count_insert++;
                            text_insert += diffs[pointer][1];
                            pointer++;
                            break;
                        case DIFF_DELETE:
                            count_delete++;
                            text_delete += diffs[pointer][1];
                            pointer++;
                            break;
                        case DIFF_EQUAL:
                            if (count_delete + count_insert > 1) {
                                if (count_delete !== 0 && count_insert !== 0) {
                                    commonlength = this.diff_commonPrefix(text_insert, text_delete);
                                    if (commonlength !== 0) {
                                        if ((pointer - count_delete - count_insert) > 0 &&
                                            diffs[pointer - count_delete - count_insert - 1][0] ==
                                                DIFF_EQUAL) {
                                            diffs[pointer - count_delete - count_insert - 1][1] +=
                                                text_insert.substring(0, commonlength);
                                        }
                                        else {
                                            diffs.splice(0, 0, [DIFF_EQUAL,
                                                text_insert.substring(0, commonlength)]);
                                            pointer++;
                                        }
                                        text_insert = text_insert.substring(commonlength);
                                        text_delete = text_delete.substring(commonlength);
                                    }
                                    commonlength = this.diff_commonSuffix(text_insert, text_delete);
                                    if (commonlength !== 0) {
                                        diffs[pointer][1] = text_insert.substring(text_insert.length -
                                            commonlength) + diffs[pointer][1];
                                        text_insert = text_insert.substring(0, text_insert.length -
                                            commonlength);
                                        text_delete = text_delete.substring(0, text_delete.length -
                                            commonlength);
                                    }
                                }
                                if (count_delete === 0) {
                                    diffs.splice(pointer - count_insert, count_delete + count_insert, [DIFF_INSERT, text_insert]);
                                }
                                else if (count_insert === 0) {
                                    diffs.splice(pointer - count_delete, count_delete + count_insert, [DIFF_DELETE, text_delete]);
                                }
                                else {
                                    diffs.splice(pointer - count_delete - count_insert, count_delete + count_insert, [DIFF_DELETE, text_delete], [DIFF_INSERT, text_insert]);
                                }
                                pointer = pointer - count_delete - count_insert +
                                    (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
                            }
                            else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
                                diffs[pointer - 1][1] += diffs[pointer][1];
                                diffs.splice(pointer, 1);
                            }
                            else {
                                pointer++;
                            }
                            count_insert = 0;
                            count_delete = 0;
                            text_delete = '';
                            text_insert = '';
                            break;
                    }
                }
                if (diffs[diffs.length - 1][1] === '') {
                    diffs.pop();
                }
                var changes = false;
                pointer = 1;
                while (pointer < diffs.length - 1) {
                    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
                        diffs[pointer + 1][0] == DIFF_EQUAL) {
                        if (diffs[pointer][1].substring(diffs[pointer][1].length -
                            diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
                            diffs[pointer][1] = diffs[pointer - 1][1] +
                                diffs[pointer][1].substring(0, diffs[pointer][1].length -
                                    diffs[pointer - 1][1].length);
                            diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
                            diffs.splice(pointer - 1, 1);
                            changes = true;
                        }
                        else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
                            diffs[pointer + 1][1]) {
                            diffs[pointer - 1][1] += diffs[pointer + 1][1];
                            diffs[pointer][1] =
                                diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
                                    diffs[pointer + 1][1];
                            diffs.splice(pointer + 1, 1);
                            changes = true;
                        }
                    }
                    pointer++;
                }
                if (changes) {
                    this.diff_cleanupMerge(diffs);
                }
            };
            diff_match_patch.prototype.diff_xIndex = function (diffs, loc) {
                var chars1 = 0;
                var chars2 = 0;
                var last_chars1 = 0;
                var last_chars2 = 0;
                var x;
                for (x = 0; x < diffs.length; x++) {
                    if (diffs[x][0] !== DIFF_INSERT) {
                        chars1 += diffs[x][1].length;
                    }
                    if (diffs[x][0] !== DIFF_DELETE) {
                        chars2 += diffs[x][1].length;
                    }
                    if (chars1 > loc) {
                        break;
                    }
                    last_chars1 = chars1;
                    last_chars2 = chars2;
                }
                if (diffs.length != x && diffs[x][0] === DIFF_DELETE) {
                    return last_chars2;
                }
                return last_chars2 + (loc - last_chars1);
            };
            diff_match_patch.prototype.diff_prettyHtml = function (diffs) {
                var html = [];
                var pattern_amp = /&/g;
                var pattern_lt = /</g;
                var pattern_gt = />/g;
                var pattern_para = /\n/g;
                for (var x = 0; x < diffs.length; x++) {
                    var op = diffs[x][0];
                    var data = diffs[x][1];
                    var text = data.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;')
                        .replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');
                    switch (op) {
                        case DIFF_INSERT:
                            html[x] = '<ins style="background:#e6ffe6;">' + text + '</ins>';
                            break;
                        case DIFF_DELETE:
                            html[x] = '<del style="background:#ffe6e6;">' + text + '</del>';
                            break;
                        case DIFF_EQUAL:
                            html[x] = '<span>' + text + '</span>';
                            break;
                    }
                }
                return html.join('');
            };
            diff_match_patch.prototype.diff_text1 = function (diffs) {
                var text = [];
                for (var x = 0; x < diffs.length; x++) {
                    if (diffs[x][0] !== DIFF_INSERT) {
                        text[x] = diffs[x][1];
                    }
                }
                return text.join('');
            };
            diff_match_patch.prototype.diff_text2 = function (diffs) {
                var text = [];
                for (var x = 0; x < diffs.length; x++) {
                    if (diffs[x][0] !== DIFF_DELETE) {
                        text[x] = diffs[x][1];
                    }
                }
                return text.join('');
            };
            diff_match_patch.prototype.diff_levenshtein = function (diffs) {
                var levenshtein = 0;
                var insertions = 0;
                var deletions = 0;
                for (var x = 0; x < diffs.length; x++) {
                    var op = diffs[x][0];
                    var data = diffs[x][1];
                    switch (op) {
                        case DIFF_INSERT:
                            insertions += data.length;
                            break;
                        case DIFF_DELETE:
                            deletions += data.length;
                            break;
                        case DIFF_EQUAL:
                            levenshtein += Math.max(insertions, deletions);
                            insertions = 0;
                            deletions = 0;
                            break;
                    }
                }
                levenshtein += Math.max(insertions, deletions);
                return levenshtein;
            };
            diff_match_patch.prototype.diff_toDelta = function (diffs) {
                var text = [];
                for (var x = 0; x < diffs.length; x++) {
                    switch (diffs[x][0]) {
                        case DIFF_INSERT:
                            text[x] = '+' + encodeURI(diffs[x][1]);
                            break;
                        case DIFF_DELETE:
                            text[x] = '-' + diffs[x][1].length;
                            break;
                        case DIFF_EQUAL:
                            text[x] = '=' + diffs[x][1].length;
                            break;
                    }
                }
                return text.join('\t').replace(/%20/g, ' ');
            };
            diff_match_patch.prototype.diff_fromDelta = function (text1, delta) {
                var diffs = [];
                var diffsLength = 0;
                var pointer = 0;
                var tokens = delta.split(/\t/g);
                for (var x = 0; x < tokens.length; x++) {
                    var param = tokens[x].substring(1);
                    switch (tokens[x].charAt(0)) {
                        case '+':
                            try {
                                diffs[diffsLength++] = [DIFF_INSERT, decodeURI(param)];
                            }
                            catch (ex) {
                                throw new Error('Illegal escape in diff_fromDelta: ' + param);
                            }
                            break;
                        case '-':
                        case '=':
                            var n = parseInt(param, 10);
                            if (isNaN(n) || n < 0) {
                                throw new Error('Invalid number in diff_fromDelta: ' + param);
                            }
                            var text = text1.substring(pointer, pointer += n);
                            if (tokens[x].charAt(0) == '=') {
                                diffs[diffsLength++] = [DIFF_EQUAL, text];
                            }
                            else {
                                diffs[diffsLength++] = [DIFF_DELETE, text];
                            }
                            break;
                        default:
                            if (tokens[x]) {
                                throw new Error('Invalid diff operation in diff_fromDelta: ' +
                                    tokens[x]);
                            }
                    }
                }
                if (pointer != text1.length) {
                    throw new Error('Delta length (' + pointer +
                        ') does not equal source text length (' + text1.length + ').');
                }
                return diffs;
            };
            diff_match_patch.prototype.match_main = function (text, pattern, loc) {
                if (text == null || pattern == null || loc == null) {
                    throw new Error('Null input. (match_main)');
                }
                loc = Math.max(0, Math.min(loc, text.length));
                if (text == pattern) {
                    return 0;
                }
                else if (!text.length) {
                    return -1;
                }
                else if (text.substring(loc, loc + pattern.length) == pattern) {
                    return loc;
                }
                else {
                    return this.match_bitap_(text, pattern, loc);
                }
            };
            diff_match_patch.prototype.match_bitap_ = function (text, pattern, loc) {
                if (pattern.length > this.Match_MaxBits) {
                    throw new Error('Pattern too long for this browser.');
                }
                var s = this.match_alphabet_(pattern);
                var dmp = this;
                function match_bitapScore_(e, x) {
                    var accuracy = e / pattern.length;
                    var proximity = Math.abs(loc - x);
                    if (!dmp.Match_Distance) {
                        return proximity ? 1.0 : accuracy;
                    }
                    return accuracy + (proximity / dmp.Match_Distance);
                }
                var score_threshold = this.Match_Threshold;
                var best_loc = text.indexOf(pattern, loc);
                if (best_loc != -1) {
                    score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
                    best_loc = text.lastIndexOf(pattern, loc + pattern.length);
                    if (best_loc != -1) {
                        score_threshold =
                            Math.min(match_bitapScore_(0, best_loc), score_threshold);
                    }
                }
                var matchmask = 1 << (pattern.length - 1);
                best_loc = -1;
                var bin_min, bin_mid;
                var bin_max = pattern.length + text.length;
                var last_rd;
                for (var d = 0; d < pattern.length; d++) {
                    bin_min = 0;
                    bin_mid = bin_max;
                    while (bin_min < bin_mid) {
                        if (match_bitapScore_(d, loc + bin_mid) <= score_threshold) {
                            bin_min = bin_mid;
                        }
                        else {
                            bin_max = bin_mid;
                        }
                        bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
                    }
                    bin_max = bin_mid;
                    var start = Math.max(1, loc - bin_mid + 1);
                    var finish = Math.min(loc + bin_mid, text.length) + pattern.length;
                    var rd = Array(finish + 2);
                    rd[finish + 1] = (1 << d) - 1;
                    for (var j = finish; j >= start; j--) {
                        var charMatch = s[text.charAt(j - 1)];
                        if (d === 0) {
                            rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
                        }
                        else {
                            rd[j] = (((rd[j + 1] << 1) | 1) & charMatch) |
                                (((last_rd[j + 1] | last_rd[j]) << 1) | 1) |
                                last_rd[j + 1];
                        }
                        if (rd[j] & matchmask) {
                            var score = match_bitapScore_(d, j - 1);
                            if (score <= score_threshold) {
                                score_threshold = score;
                                best_loc = j - 1;
                                if (best_loc > loc) {
                                    start = Math.max(1, 2 * loc - best_loc);
                                }
                                else {
                                    break;
                                }
                            }
                        }
                    }
                    if (match_bitapScore_(d + 1, loc) > score_threshold) {
                        break;
                    }
                    last_rd = rd;
                }
                return best_loc;
            };
            diff_match_patch.prototype.match_alphabet_ = function (pattern) {
                var s = {};
                for (var i = 0; i < pattern.length; i++) {
                    s[pattern.charAt(i)] = 0;
                }
                for (var i = 0; i < pattern.length; i++) {
                    s[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
                }
                return s;
            };
            diff_match_patch.prototype.patch_addContext_ = function (patch, text) {
                if (text.length == 0) {
                    return;
                }
                var pattern = text.substring(patch.start2, patch.start2 + patch.length1);
                var padding = 0;
                while (text.indexOf(pattern) != text.lastIndexOf(pattern) &&
                    pattern.length < this.Match_MaxBits - this.Patch_Margin -
                        this.Patch_Margin) {
                    padding += this.Patch_Margin;
                    pattern = text.substring(patch.start2 - padding, patch.start2 + patch.length1 + padding);
                }
                padding += this.Patch_Margin;
                var prefix = text.substring(patch.start2 - padding, patch.start2);
                if (prefix) {
                    patch.diffs.unshift([DIFF_EQUAL, prefix]);
                }
                var suffix = text.substring(patch.start2 + patch.length1, patch.start2 + patch.length1 + padding);
                if (suffix) {
                    patch.diffs.push([DIFF_EQUAL, suffix]);
                }
                patch.start1 -= prefix.length;
                patch.start2 -= prefix.length;
                patch.length1 += prefix.length + suffix.length;
                patch.length2 += prefix.length + suffix.length;
            };
            diff_match_patch.prototype.patch_make = function (a, opt_b, opt_c) {
                var text1, diffs;
                if (typeof a == 'string' && typeof opt_b == 'string' &&
                    typeof opt_c == 'undefined') {
                    text1 = (a);
                    diffs = this.diff_main(text1, (opt_b), true);
                    if (diffs.length > 2) {
                        this.diff_cleanupSemantic(diffs);
                        this.diff_cleanupEfficiency(diffs);
                    }
                }
                else if (a && typeof a == 'object' && typeof opt_b == 'undefined' &&
                    typeof opt_c == 'undefined') {
                    diffs = (a);
                    text1 = this.diff_text1(diffs);
                }
                else if (typeof a == 'string' && opt_b && typeof opt_b == 'object' &&
                    typeof opt_c == 'undefined') {
                    text1 = (a);
                    diffs = (opt_b);
                }
                else if (typeof a == 'string' && typeof opt_b == 'string' &&
                    opt_c && typeof opt_c == 'object') {
                    text1 = (a);
                    diffs = (opt_c);
                }
                else {
                    throw new Error('Unknown call format to patch_make.');
                }
                if (diffs.length === 0) {
                    return [];
                }
                var patches = [];
                var patch = new diff_match_patch.patch_obj();
                var patchDiffLength = 0;
                var char_count1 = 0;
                var char_count2 = 0;
                var prepatch_text = text1;
                var postpatch_text = text1;
                for (var x = 0; x < diffs.length; x++) {
                    var diff_type = diffs[x][0];
                    var diff_text = diffs[x][1];
                    if (!patchDiffLength && diff_type !== DIFF_EQUAL) {
                        patch.start1 = char_count1;
                        patch.start2 = char_count2;
                    }
                    switch (diff_type) {
                        case DIFF_INSERT:
                            patch.diffs[patchDiffLength++] = diffs[x];
                            patch.length2 += diff_text.length;
                            postpatch_text = postpatch_text.substring(0, char_count2) + diff_text +
                                postpatch_text.substring(char_count2);
                            break;
                        case DIFF_DELETE:
                            patch.length1 += diff_text.length;
                            patch.diffs[patchDiffLength++] = diffs[x];
                            postpatch_text = postpatch_text.substring(0, char_count2) +
                                postpatch_text.substring(char_count2 +
                                    diff_text.length);
                            break;
                        case DIFF_EQUAL:
                            if (diff_text.length <= 2 * this.Patch_Margin &&
                                patchDiffLength && diffs.length != x + 1) {
                                patch.diffs[patchDiffLength++] = diffs[x];
                                patch.length1 += diff_text.length;
                                patch.length2 += diff_text.length;
                            }
                            else if (diff_text.length >= 2 * this.Patch_Margin) {
                                if (patchDiffLength) {
                                    this.patch_addContext_(patch, prepatch_text);
                                    patches.push(patch);
                                    patch = new diff_match_patch.patch_obj();
                                    patchDiffLength = 0;
                                    prepatch_text = postpatch_text;
                                    char_count1 = char_count2;
                                }
                            }
                            break;
                    }
                    if (diff_type !== DIFF_INSERT) {
                        char_count1 += diff_text.length;
                    }
                    if (diff_type !== DIFF_DELETE) {
                        char_count2 += diff_text.length;
                    }
                }
                if (patchDiffLength) {
                    this.patch_addContext_(patch, prepatch_text);
                    patches.push(patch);
                }
                return patches;
            };
            diff_match_patch.prototype.patch_deepCopy = function (patches) {
                var patchesCopy = [];
                for (var x = 0; x < patches.length; x++) {
                    var patch = patches[x];
                    var patchCopy = new diff_match_patch.patch_obj();
                    patchCopy.diffs = [];
                    for (var y = 0; y < patch.diffs.length; y++) {
                        patchCopy.diffs[y] = patch.diffs[y].slice();
                    }
                    patchCopy.start1 = patch.start1;
                    patchCopy.start2 = patch.start2;
                    patchCopy.length1 = patch.length1;
                    patchCopy.length2 = patch.length2;
                    patchesCopy[x] = patchCopy;
                }
                return patchesCopy;
            };
            diff_match_patch.prototype.patch_apply = function (patches, text) {
                if (patches.length == 0) {
                    return [text, []];
                }
                patches = this.patch_deepCopy(patches);
                var nullPadding = this.patch_addPadding(patches);
                text = nullPadding + text + nullPadding;
                this.patch_splitMax(patches);
                var delta = 0;
                var results = [];
                for (var x = 0; x < patches.length; x++) {
                    var expected_loc = patches[x].start2 + delta;
                    var text1 = this.diff_text1(patches[x].diffs);
                    var start_loc;
                    var end_loc = -1;
                    if (text1.length > this.Match_MaxBits) {
                        start_loc = this.match_main(text, text1.substring(0, this.Match_MaxBits), expected_loc);
                        if (start_loc != -1) {
                            end_loc = this.match_main(text, text1.substring(text1.length - this.Match_MaxBits), expected_loc + text1.length - this.Match_MaxBits);
                            if (end_loc == -1 || start_loc >= end_loc) {
                                start_loc = -1;
                            }
                        }
                    }
                    else {
                        start_loc = this.match_main(text, text1, expected_loc);
                    }
                    if (start_loc == -1) {
                        results[x] = false;
                        delta -= patches[x].length2 - patches[x].length1;
                    }
                    else {
                        results[x] = true;
                        delta = start_loc - expected_loc;
                        var text2;
                        if (end_loc == -1) {
                            text2 = text.substring(start_loc, start_loc + text1.length);
                        }
                        else {
                            text2 = text.substring(start_loc, end_loc + this.Match_MaxBits);
                        }
                        if (text1 == text2) {
                            text = text.substring(0, start_loc) +
                                this.diff_text2(patches[x].diffs) +
                                text.substring(start_loc + text1.length);
                        }
                        else {
                            var diffs = this.diff_main(text1, text2, false);
                            if (text1.length > this.Match_MaxBits &&
                                this.diff_levenshtein(diffs) / text1.length >
                                    this.Patch_DeleteThreshold) {
                                results[x] = false;
                            }
                            else {
                                this.diff_cleanupSemanticLossless(diffs);
                                var index1 = 0;
                                var index2;
                                for (var y = 0; y < patches[x].diffs.length; y++) {
                                    var mod = patches[x].diffs[y];
                                    if (mod[0] !== DIFF_EQUAL) {
                                        index2 = this.diff_xIndex(diffs, index1);
                                    }
                                    if (mod[0] === DIFF_INSERT) {
                                        text = text.substring(0, start_loc + index2) + mod[1] +
                                            text.substring(start_loc + index2);
                                    }
                                    else if (mod[0] === DIFF_DELETE) {
                                        text = text.substring(0, start_loc + index2) +
                                            text.substring(start_loc + this.diff_xIndex(diffs, index1 + mod[1].length));
                                    }
                                    if (mod[0] !== DIFF_DELETE) {
                                        index1 += mod[1].length;
                                    }
                                }
                            }
                        }
                    }
                }
                text = text.substring(nullPadding.length, text.length - nullPadding.length);
                return [text, results];
            };
            diff_match_patch.prototype.patch_addPadding = function (patches) {
                var paddingLength = this.Patch_Margin;
                var nullPadding = '';
                for (var x = 1; x <= paddingLength; x++) {
                    nullPadding += String.fromCharCode(x);
                }
                for (var x = 0; x < patches.length; x++) {
                    patches[x].start1 += paddingLength;
                    patches[x].start2 += paddingLength;
                }
                var patch = patches[0];
                var diffs = patch.diffs;
                if (diffs.length == 0 || diffs[0][0] != DIFF_EQUAL) {
                    diffs.unshift([DIFF_EQUAL, nullPadding]);
                    patch.start1 -= paddingLength;
                    patch.start2 -= paddingLength;
                    patch.length1 += paddingLength;
                    patch.length2 += paddingLength;
                }
                else if (paddingLength > diffs[0][1].length) {
                    var extraLength = paddingLength - diffs[0][1].length;
                    diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1];
                    patch.start1 -= extraLength;
                    patch.start2 -= extraLength;
                    patch.length1 += extraLength;
                    patch.length2 += extraLength;
                }
                patch = patches[patches.length - 1];
                diffs = patch.diffs;
                if (diffs.length == 0 || diffs[diffs.length - 1][0] != DIFF_EQUAL) {
                    diffs.push([DIFF_EQUAL, nullPadding]);
                    patch.length1 += paddingLength;
                    patch.length2 += paddingLength;
                }
                else if (paddingLength > diffs[diffs.length - 1][1].length) {
                    var extraLength = paddingLength - diffs[diffs.length - 1][1].length;
                    diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
                    patch.length1 += extraLength;
                    patch.length2 += extraLength;
                }
                return nullPadding;
            };
            diff_match_patch.prototype.patch_splitMax = function (patches) {
                var patch_size = this.Match_MaxBits;
                for (var x = 0; x < patches.length; x++) {
                    if (patches[x].length1 <= patch_size) {
                        continue;
                    }
                    var bigpatch = patches[x];
                    patches.splice(x--, 1);
                    var start1 = bigpatch.start1;
                    var start2 = bigpatch.start2;
                    var precontext = '';
                    while (bigpatch.diffs.length !== 0) {
                        var patch = new diff_match_patch.patch_obj();
                        var empty = true;
                        patch.start1 = start1 - precontext.length;
                        patch.start2 = start2 - precontext.length;
                        if (precontext !== '') {
                            patch.length1 = patch.length2 = precontext.length;
                            patch.diffs.push([DIFF_EQUAL, precontext]);
                        }
                        while (bigpatch.diffs.length !== 0 &&
                            patch.length1 < patch_size - this.Patch_Margin) {
                            var diff_type = bigpatch.diffs[0][0];
                            var diff_text = bigpatch.diffs[0][1];
                            if (diff_type === DIFF_INSERT) {
                                patch.length2 += diff_text.length;
                                start2 += diff_text.length;
                                patch.diffs.push(bigpatch.diffs.shift());
                                empty = false;
                            }
                            else if (diff_type === DIFF_DELETE && patch.diffs.length == 1 &&
                                patch.diffs[0][0] == DIFF_EQUAL &&
                                diff_text.length > 2 * patch_size) {
                                patch.length1 += diff_text.length;
                                start1 += diff_text.length;
                                empty = false;
                                patch.diffs.push([diff_type, diff_text]);
                                bigpatch.diffs.shift();
                            }
                            else {
                                diff_text = diff_text.substring(0, patch_size - patch.length1 - this.Patch_Margin);
                                patch.length1 += diff_text.length;
                                start1 += diff_text.length;
                                if (diff_type === DIFF_EQUAL) {
                                    patch.length2 += diff_text.length;
                                    start2 += diff_text.length;
                                }
                                else {
                                    empty = false;
                                }
                                patch.diffs.push([diff_type, diff_text]);
                                if (diff_text == bigpatch.diffs[0][1]) {
                                    bigpatch.diffs.shift();
                                }
                                else {
                                    bigpatch.diffs[0][1] =
                                        bigpatch.diffs[0][1].substring(diff_text.length);
                                }
                            }
                        }
                        precontext = this.diff_text2(patch.diffs);
                        precontext =
                            precontext.substring(precontext.length - this.Patch_Margin);
                        var postcontext = this.diff_text1(bigpatch.diffs)
                            .substring(0, this.Patch_Margin);
                        if (postcontext !== '') {
                            patch.length1 += postcontext.length;
                            patch.length2 += postcontext.length;
                            if (patch.diffs.length !== 0 &&
                                patch.diffs[patch.diffs.length - 1][0] === DIFF_EQUAL) {
                                patch.diffs[patch.diffs.length - 1][1] += postcontext;
                            }
                            else {
                                patch.diffs.push([DIFF_EQUAL, postcontext]);
                            }
                        }
                        if (!empty) {
                            patches.splice(++x, 0, patch);
                        }
                    }
                }
            };
            diff_match_patch.prototype.patch_toText = function (patches) {
                var text = [];
                for (var x = 0; x < patches.length; x++) {
                    text[x] = patches[x];
                }
                return text.join('');
            };
            diff_match_patch.prototype.patch_fromText = function (textline) {
                var patches = [];
                if (!textline) {
                    return patches;
                }
                var text = textline.split('\n');
                var textPointer = 0;
                var patchHeader = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;
                while (textPointer < text.length) {
                    var m = text[textPointer].match(patchHeader);
                    if (!m) {
                        throw new Error('Invalid patch string: ' + text[textPointer]);
                    }
                    var patch = new diff_match_patch.patch_obj();
                    patches.push(patch);
                    patch.start1 = parseInt(m[1], 10);
                    if (m[2] === '') {
                        patch.start1--;
                        patch.length1 = 1;
                    }
                    else if (m[2] == '0') {
                        patch.length1 = 0;
                    }
                    else {
                        patch.start1--;
                        patch.length1 = parseInt(m[2], 10);
                    }
                    patch.start2 = parseInt(m[3], 10);
                    if (m[4] === '') {
                        patch.start2--;
                        patch.length2 = 1;
                    }
                    else if (m[4] == '0') {
                        patch.length2 = 0;
                    }
                    else {
                        patch.start2--;
                        patch.length2 = parseInt(m[4], 10);
                    }
                    textPointer++;
                    while (textPointer < text.length) {
                        var sign = text[textPointer].charAt(0);
                        try {
                            var line = decodeURI(text[textPointer].substring(1));
                        }
                        catch (ex) {
                            throw new Error('Illegal escape in patch_fromText: ' + line);
                        }
                        if (sign == '-') {
                            patch.diffs.push([DIFF_DELETE, line]);
                        }
                        else if (sign == '+') {
                            patch.diffs.push([DIFF_INSERT, line]);
                        }
                        else if (sign == ' ') {
                            patch.diffs.push([DIFF_EQUAL, line]);
                        }
                        else if (sign == '@') {
                            break;
                        }
                        else if (sign === '') {
                        }
                        else {
                            throw new Error('Invalid patch mode "' + sign + '" in: ' + line);
                        }
                        textPointer++;
                    }
                }
                return patches;
            };
            diff_match_patch.patch_obj = function () {
                this.diffs = [];
                this.start1 = null;
                this.start2 = null;
                this.length1 = 0;
                this.length2 = 0;
            };
            diff_match_patch.patch_obj.prototype.toString = function () {
                var coords1, coords2;
                if (this.length1 === 0) {
                    coords1 = this.start1 + ',0';
                }
                else if (this.length1 == 1) {
                    coords1 = this.start1 + 1;
                }
                else {
                    coords1 = (this.start1 + 1) + ',' + this.length1;
                }
                if (this.length2 === 0) {
                    coords2 = this.start2 + ',0';
                }
                else if (this.length2 == 1) {
                    coords2 = this.start2 + 1;
                }
                else {
                    coords2 = (this.start2 + 1) + ',' + this.length2;
                }
                var text = ['@@ -' + coords1 + ' +' + coords2 + ' @@\n'];
                var op;
                for (var x = 0; x < this.diffs.length; x++) {
                    switch (this.diffs[x][0]) {
                        case DIFF_INSERT:
                            op = '+';
                            break;
                        case DIFF_DELETE:
                            op = '-';
                            break;
                        case DIFF_EQUAL:
                            op = ' ';
                            break;
                    }
                    text[x + 1] = op + encodeURI(this.diffs[x][1]) + '\n';
                }
                return text.join('').replace(/%20/g, ' ');
            };
            module.exports = diff_match_patch;
            module.exports['diff_match_patch'] = diff_match_patch;
            module.exports['DIFF_DELETE'] = DIFF_DELETE;
            module.exports['DIFF_INSERT'] = DIFF_INSERT;
            module.exports['DIFF_EQUAL'] = DIFF_EQUAL;
        }, {}], 2: [function (require, module, exports) {
            (function (acrolinx) {
                var dmpModule = require('diff-match-patch');
                acrolinx.diffMatchPatch = {
                    DiffMatchPatch: dmpModule.diff_match_patch,
                    DIFF_DELETE: dmpModule.DIFF_DELETE,
                    DIFF_INSERT: dmpModule.DIFF_INSERT,
                    DIFF_EQUAL: dmpModule.DIFF_EQUAL
                };
            })(acrolinx || (acrolinx = {}));
        }, { "diff-match-patch": 1 }] }, {}, [2]);
var acrolinxLibs;
(function (acrolinxLibs) {
    'use strict';
    var windowWithLibs = window;
    var originalAcrolinxLibs = windowWithLibs['acrolinxLibs'] || {};
    acrolinxLibs.Q = originalAcrolinxLibs.Q || windowWithLibs['Q'];
    acrolinxLibs._ = originalAcrolinxLibs._ || windowWithLibs['_'];
})(acrolinxLibs || (acrolinxLibs = {}));
var acrolinx;
(function (acrolinx) {
    var sidebar;
    (function (sidebar) {
        'use strict';
        sidebar.SoftwareComponentCategory = {
            MAIN: 'MAIN',
            DEFAULT: 'DEFAULT',
            DETAIL: 'DETAIL'
        };
        sidebar.ErrorCodes = {
            checkIsAlreadyRunning: 'checkIsAlreadyRunning',
            userIsNotLoggedIn: 'userIsNotLoggedIn',
            sidebarNotReadyForCheck: 'sidebarNotReadyForCheck',
            checkCanceledByUser: 'checkCanceledByUser',
            base64EncodedGzippedUnsupported: 'base64EncodedGzippedUnsupported'
        };
    })(sidebar = acrolinx.sidebar || (acrolinx.sidebar = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var utils;
        (function (utils) {
            var isEnabled = false;
            function log(message) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (isEnabled) {
                    console.log.apply(console, [message].concat(args));
                }
            }
            utils.log = log;
            function enableLogging() {
                isEnabled = true;
            }
            utils.enableLogging = enableLogging;
        })(utils = plugins.utils || (plugins.utils = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var utils;
        (function (utils) {
            var _ = acrolinxLibs._;
            function findDisplacement(offsetMappingArray, originalIndex) {
                if (offsetMappingArray.length === 0) {
                    return 0;
                }
                var index = _.sortedIndexBy(offsetMappingArray, { diffOffset: 0, oldPosition: originalIndex + 0.1 }, function (offsetAlign) { return offsetAlign.oldPosition; });
                return index > 0 ? offsetMappingArray[index - 1].diffOffset : 0;
            }
            utils.findDisplacement = findDisplacement;
            function findNewIndex(offsetMappingArray, originalIndex) {
                return originalIndex + findDisplacement(offsetMappingArray, originalIndex);
            }
            utils.findNewIndex = findNewIndex;
        })(utils = plugins.utils || (plugins.utils = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var lookup;
        (function (lookup) {
            var diffbased;
            (function (diffbased) {
                'use strict';
                var _ = acrolinxLibs._;
                var log = acrolinx.plugins.utils.log;
                var findNewIndex = acrolinx.plugins.utils.findNewIndex;
                var _a = acrolinx.diffMatchPatch, DIFF_EQUAL = _a.DIFF_EQUAL, DIFF_DELETE = _a.DIFF_DELETE, DIFF_INSERT = _a.DIFF_INSERT;
                var dmp = new acrolinx.diffMatchPatch.DiffMatchPatch();
                function createOffsetMappingArray(diffs) {
                    var offsetMappingArray = [];
                    var offsetCountOld = 0;
                    var currentDiffOffset = 0;
                    diffs.forEach(function (diff) {
                        var action = diff[0], value = diff[1];
                        switch (action) {
                            case DIFF_EQUAL:
                                offsetCountOld += value.length;
                                break;
                            case DIFF_DELETE:
                                offsetCountOld += value.length;
                                currentDiffOffset -= value.length;
                                break;
                            case DIFF_INSERT:
                                currentDiffOffset += value.length;
                                break;
                            default:
                                throw new Error('Illegal Diff Action: ' + action);
                        }
                        offsetMappingArray.push({
                            oldPosition: offsetCountOld,
                            diffOffset: currentDiffOffset
                        });
                    });
                    return offsetMappingArray;
                }
                diffbased.createOffsetMappingArray = createOffsetMappingArray;
                function decodeEntities(entity) {
                    var el = document.createElement('div');
                    el.innerHTML = entity;
                    return el.textContent;
                }
                function replaceTags(s) {
                    var regExp = /(<([^>]+)>|&.*?;)/ig;
                    var offsetMapping = [];
                    var currentDiffOffset = 0;
                    var resultText = s.replace(regExp, function (tagOrEntity, p1, p2, offset) {
                        var rep = _.startsWith(tagOrEntity, '&') ? decodeEntities(tagOrEntity) : '';
                        currentDiffOffset -= tagOrEntity.length - rep.length;
                        offsetMapping.push({
                            oldPosition: offset + tagOrEntity.length,
                            diffOffset: currentDiffOffset
                        });
                        return rep;
                    });
                    return [resultText, offsetMapping];
                }
                diffbased.replaceTags = replaceTags;
                function rangeContent(content, m) {
                    return content.slice(m.range[0], m.range[1]);
                }
                function lookupMatches(checkedDocument, currentDocument, matches, inputFormat) {
                    if (inputFormat === void 0) { inputFormat = 'HTML'; }
                    if (_.isEmpty(matches)) {
                        return [];
                    }
                    var _a = inputFormat === 'HTML' ? replaceTags(checkedDocument) : [checkedDocument, []], cleanedCheckedDocument = _a[0], cleaningOffsetMappingArray = _a[1];
                    var diffs = dmp.diff_main(cleanedCheckedDocument, currentDocument);
                    var offsetMappingArray = createOffsetMappingArray(diffs);
                    var alignedMatches = matches.map(function (match) {
                        var beginAfterCleaning = findNewIndex(cleaningOffsetMappingArray, match.range[0]);
                        var endAfterCleaning = findNewIndex(cleaningOffsetMappingArray, match.range[1]);
                        var alignedBegin = findNewIndex(offsetMappingArray, beginAfterCleaning);
                        var lastCharacterPos = endAfterCleaning - 1;
                        var alignedEnd = findNewIndex(offsetMappingArray, lastCharacterPos) + 1;
                        return {
                            originalMatch: match,
                            range: [alignedBegin, alignedEnd],
                        };
                    });
                    var containsModifiedMatches = _.some(alignedMatches, function (m) { return rangeContent(currentDocument, m) !== m.originalMatch.content; });
                    log('checkedDocument', checkedDocument);
                    log('cleanedCheckedDocument', cleanedCheckedDocument);
                    log('cleanedCheckedDocumentCodes', cleanedCheckedDocument.split('').map(function (c) { return c.charCodeAt(0); }));
                    log('currentDocument', currentDocument);
                    log('currentDocumentCodes', currentDocument.split('').map(function (c) { return c.charCodeAt(0); }));
                    log('matches', matches);
                    log('diffs', diffs);
                    log('alignedMatches', alignedMatches);
                    log('alignedMatchesContent', alignedMatches.map(function (m) { return rangeContent(currentDocument, m); }));
                    return containsModifiedMatches ? [] : alignedMatches;
                }
                diffbased.lookupMatches = lookupMatches;
            })(diffbased = lookup.diffbased || (lookup.diffbased = {}));
        })(lookup = plugins.lookup || (plugins.lookup = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var utils;
        (function (utils) {
            function logTime(text, f) {
                var startTime = Date.now();
                var result = f();
                console.log("Duration of \"" + text + ":\"", Date.now() - startTime);
                return result;
            }
            utils.logTime = logTime;
            function getCompleteFlagLength(matches) {
                return matches[matches.length - 1].range[1] - matches[0].range[0];
            }
            utils.getCompleteFlagLength = getCompleteFlagLength;
            function fetch(url, callback) {
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                request.onload = function () {
                    if (request.status >= 200 && request.status < 400) {
                        callback(request.responseText);
                    }
                    else {
                        throw new Error("Error while loading " + url + ".");
                    }
                };
                request.onerror = function () {
                    throw new Error("Error while loading " + url + ".");
                };
                request.send();
            }
            utils.fetch = fetch;
            function isIFrame(el) {
                return el.nodeName === 'IFRAME';
            }
            utils.isIFrame = isIFrame;
            function fakeInputEvent(el) {
                el.dispatchEvent(new CustomEvent('input'));
            }
            utils.fakeInputEvent = fakeInputEvent;
            function parseUrl(href) {
                var aElement = document.createElement('a');
                aElement.href = href;
                if (aElement.host === '') {
                    aElement.href = aElement.href;
                }
                var protocol = aElement.protocol, host = aElement.host, hostname = aElement.hostname, port = aElement.port, pathname = aElement.pathname, hash = aElement.hash;
                return { protocol: protocol, host: host, hostname: hostname, port: port, pathname: pathname, hash: hash };
            }
            utils.parseUrl = parseUrl;
            function isFromSameOrigin(url) {
                var _a = parseUrl(url), protocol = _a.protocol, host = _a.host;
                return location.protocol === protocol && location.host === host;
            }
            utils.isFromSameOrigin = isFromSameOrigin;
        })(utils = plugins.utils || (plugins.utils = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var adapter;
        (function (adapter) {
            'use strict';
            var lookupMatches = acrolinx.plugins.lookup.diffbased.lookupMatches;
            var _ = acrolinxLibs._;
            var getCompleteFlagLength = acrolinx.plugins.utils.getCompleteFlagLength;
            var fakeInputEvent = acrolinx.plugins.utils.fakeInputEvent;
            var AbstractRichtextEditorAdapter = (function () {
                function AbstractRichtextEditorAdapter(conf) {
                    this.config = conf;
                }
                AbstractRichtextEditorAdapter.prototype.getEditorElement = function () {
                    return this.getEditorDocument().querySelector('body');
                };
                AbstractRichtextEditorAdapter.prototype.registerCheckCall = function (checkInfo) {
                };
                AbstractRichtextEditorAdapter.prototype.registerCheckResult = function (checkResult) {
                    this.isCheckingNow = false;
                    this.currentHtmlChecking = this.html;
                    this.prevCheckedHtml = this.currentHtmlChecking;
                };
                AbstractRichtextEditorAdapter.prototype.extractContentForCheck = function () {
                    this.html = this.getContent();
                    this.currentHtmlChecking = this.html;
                    return { content: this.html };
                };
                AbstractRichtextEditorAdapter.prototype.scrollIntoView = function (sel) {
                    var range = sel.getRangeAt(0);
                    var tmp = range.cloneRange();
                    tmp.collapse(false);
                    var text = document.createElement('span');
                    tmp.insertNode(text);
                    text.scrollIntoView();
                    this.scrollElementIntoView(text);
                    text.remove();
                };
                AbstractRichtextEditorAdapter.prototype.scrollToCurrentSelection = function () {
                    var selection1 = this.getEditorDocument().getSelection();
                    if (selection1) {
                        try {
                            this.scrollIntoView(selection1);
                        }
                        catch (error) {
                            console.log('Scrolling Error: ', error);
                        }
                    }
                };
                AbstractRichtextEditorAdapter.prototype.scrollElementIntoView = function (el) {
                    el.scrollIntoView();
                };
                AbstractRichtextEditorAdapter.prototype.selectRanges = function (checkId, matches) {
                    this.selectMatches(checkId, matches);
                    this.scrollToCurrentSelection();
                };
                AbstractRichtextEditorAdapter.prototype.selectMatches = function (checkId, matches) {
                    var textMapping = this.getTextDomMapping();
                    var alignedMatches = lookupMatches(this.currentHtmlChecking, textMapping.text, matches);
                    if (_.isEmpty(alignedMatches)) {
                        throw new Error('Selected flagged content is modified.');
                    }
                    this.selectAlignedMatches(alignedMatches, textMapping);
                    return [alignedMatches, textMapping];
                };
                AbstractRichtextEditorAdapter.prototype.selectAlignedMatches = function (matches, textMapping) {
                    var newBegin = matches[0].range[0];
                    var matchLength = getCompleteFlagLength(matches);
                    this.selectText(newBegin, matchLength, textMapping);
                };
                AbstractRichtextEditorAdapter.prototype.selectText = function (begin, length, textMapping) {
                    if (!textMapping.text) {
                        return;
                    }
                    var doc = this.getEditorDocument();
                    var selection = doc.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(this.createRange(begin, length, textMapping));
                };
                AbstractRichtextEditorAdapter.prototype.createRange = function (begin, length, textMapping) {
                    var doc = this.getEditorDocument();
                    var range = doc.createRange();
                    var beginDomPosition = textMapping.domPositions[begin];
                    var endDomPosition = plugins.utils.getEndDomPos(begin + length, textMapping.domPositions);
                    range.setStart(beginDomPosition.node, beginDomPosition.offset);
                    range.setEnd(endDomPosition.node, endDomPosition.offset);
                    return range;
                };
                AbstractRichtextEditorAdapter.prototype.replaceAlignedMatches = function (matches) {
                    var doc = this.getEditorDocument();
                    var reversedMatches = _.clone(matches).reverse();
                    for (var _i = 0, reversedMatches_1 = reversedMatches; _i < reversedMatches_1.length; _i++) {
                        var match = reversedMatches_1[_i];
                        var textDomMapping = this.getTextDomMapping();
                        var rangeLength = match.range[1] - match.range[0];
                        if (rangeLength > 1) {
                            var tail = this.createRange(match.range[0] + 1, rangeLength - 1, textDomMapping);
                            var head = this.createRange(match.range[0], 1, textDomMapping);
                            tail.deleteContents();
                            head.deleteContents();
                            head.insertNode(doc.createTextNode(match.originalMatch.replacement));
                        }
                        else {
                            var range = this.createRange(match.range[0], rangeLength, textDomMapping);
                            range.deleteContents();
                            range.insertNode(doc.createTextNode(match.originalMatch.replacement));
                        }
                    }
                };
                AbstractRichtextEditorAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    var alignedMatches = this.selectMatches(checkId, matchesWithReplacement)[0];
                    var replacement = alignedMatches.map(function (m) { return m.originalMatch.replacement; }).join('');
                    this.replaceAlignedMatches(alignedMatches);
                    this.selectText(alignedMatches[0].range[0], replacement.length, this.getTextDomMapping());
                    this.scrollToCurrentSelection();
                    fakeInputEvent(this.getEditorElement());
                };
                AbstractRichtextEditorAdapter.prototype.getTextDomMapping = function () {
                    return plugins.utils.extractTextDomMapping(this.getEditorElement());
                };
                return AbstractRichtextEditorAdapter;
            }());
            adapter.AbstractRichtextEditorAdapter = AbstractRichtextEditorAdapter;
        })(adapter = plugins.adapter || (plugins.adapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var adapter;
        (function (adapter) {
            function hasEditorID(a) {
                return !!a.editorId;
            }
            adapter.hasEditorID = hasEditorID;
            function hasElement(a) {
                return !!a.element;
            }
            adapter.hasElement = hasElement;
            function getElementFromAdapterConf(conf) {
                if (hasElement(conf)) {
                    return conf.element;
                }
                else if (hasEditorID(conf)) {
                    return document.getElementById(conf.editorId);
                }
                else {
                    console.error('Invalid AdapterConf. Missing editorId or element', conf);
                    throw new Error('Invalid AdapterConf. Missing editorId or element');
                }
            }
            adapter.getElementFromAdapterConf = getElementFromAdapterConf;
        })(adapter = plugins.adapter || (plugins.adapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var adapter;
        (function (adapter_1) {
            'use strict';
            var AutoBindAdapter = (function () {
                function AutoBindAdapter(conf) {
                    this.conf = conf;
                }
                AutoBindAdapter.prototype.extractContentForCheck = function () {
                    var _this = this;
                    this.multiAdapter = new acrolinx.plugins.adapter.MultiEditorAdapter(this.conf);
                    acrolinx.plugins.autobind.bindAdaptersForCurrentPage(this.conf).forEach(function (adapter) {
                        _this.multiAdapter.addSingleAdapter(adapter);
                    });
                    return this.multiAdapter.extractContentForCheck();
                };
                AutoBindAdapter.prototype.registerCheckCall = function (checkInfo) {
                };
                AutoBindAdapter.prototype.registerCheckResult = function (checkResult) {
                };
                AutoBindAdapter.prototype.selectRanges = function (checkId, matches) {
                    this.multiAdapter.selectRanges(checkId, matches);
                };
                AutoBindAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    this.multiAdapter.replaceRanges(checkId, matchesWithReplacement);
                };
                return AutoBindAdapter;
            }());
            adapter_1.AutoBindAdapter = AutoBindAdapter;
        })(adapter = plugins.adapter || (plugins.adapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var adapter;
        (function (adapter) {
            'use strict';
            var CKEditorAdapter = (function (_super) {
                __extends(CKEditorAdapter, _super);
                function CKEditorAdapter(conf) {
                    _super.call(this, conf);
                    this.editorId = conf.editorId;
                }
                CKEditorAdapter.prototype.getEditor = function () {
                    return CKEDITOR.instances[this.editorId];
                };
                CKEditorAdapter.prototype.getEditorDocument = function () {
                    return this.getEditor().document.$;
                };
                CKEditorAdapter.prototype.getContent = function () {
                    return this.getEditor().getData();
                };
                CKEditorAdapter.prototype.extractContentForCheck = function () {
                    this.html = this.getContent();
                    this.currentHtmlChecking = this.html;
                    if (this.isInWysiwygMode()) {
                        if (this.html === '') {
                            this.html = '<span> </span>';
                        }
                    }
                    else {
                        if (this.isCheckingNow) {
                            this.isCheckingNow = false;
                        }
                        else {
                            return { error: 'Action is not permitted in Source mode.' };
                        }
                    }
                    return { content: this.html };
                };
                CKEditorAdapter.prototype.selectRanges = function (checkId, matches) {
                    if (this.isInWysiwygMode()) {
                        _super.prototype.selectRanges.call(this, checkId, matches);
                    }
                    else {
                        window.alert('Action is not permitted in Source mode.');
                    }
                };
                CKEditorAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacementArg) {
                    if (this.isInWysiwygMode()) {
                        _super.prototype.replaceRanges.call(this, checkId, matchesWithReplacementArg);
                    }
                    else {
                        window.alert('Action is not permitted in Source mode.');
                    }
                };
                CKEditorAdapter.prototype.isInWysiwygMode = function () {
                    return this.getEditor().mode === 'wysiwyg';
                };
                return CKEditorAdapter;
            }(adapter.AbstractRichtextEditorAdapter));
            adapter.CKEditorAdapter = CKEditorAdapter;
        })(adapter = plugins.adapter || (plugins.adapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var utils;
        (function (utils) {
            function getRootElement(doc) {
                return (doc.documentElement || doc.body.parentNode || doc.body);
            }
            function getScrollTop(win) {
                if (win === void 0) { win = window; }
                return (win.pageYOffset !== undefined) ? win.pageYOffset : getRootElement(win.document).scrollTop;
            }
            function hasScrollBar(el) {
                return el.clientHeight !== el.scrollHeight && el.tagName !== 'BODY' && el.tagName !== 'HTML';
            }
            function findAncestors(startEl) {
                var result = [];
                var currentEl = startEl.parentElement;
                while (currentEl) {
                    result.push(currentEl);
                    currentEl = currentEl.parentElement;
                }
                return result;
            }
            function findScrollableAncestors(startEl) {
                return findAncestors(startEl).filter(hasScrollBar);
            }
            function scrollIntoView(targetEl, windowTopOffset, localTopOffset) {
                if (windowTopOffset === void 0) { windowTopOffset = 0; }
                if (localTopOffset === void 0) { localTopOffset = 0; }
                if (!windowTopOffset) {
                    targetEl.scrollIntoView();
                    return;
                }
                var pos = targetEl.getBoundingClientRect();
                var scrollableAncestors = findScrollableAncestors(targetEl);
                if (scrollableAncestors.length <= 2) {
                    scrollableAncestors.forEach(function (scrollableOuterContainer) {
                        var containerPos = scrollableOuterContainer.getBoundingClientRect();
                        if (pos.top < containerPos.top + localTopOffset || pos.bottom > containerPos.bottom) {
                            scrollableOuterContainer.scrollTop = pos.top - containerPos.top - localTopOffset;
                        }
                    });
                }
                var scrollTop = getScrollTop();
                if (pos.top < windowTopOffset || pos.bottom > window.innerHeight) {
                    window.scrollTo(0, scrollTop + pos.top - windowTopOffset);
                }
            }
            utils.scrollIntoView = scrollIntoView;
        })(utils = plugins.utils || (plugins.utils = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var adapter;
        (function (adapter) {
            'use strict';
            var scrollIntoView = acrolinx.plugins.utils.scrollIntoView;
            var ContentEditableAdapter = (function (_super) {
                __extends(ContentEditableAdapter, _super);
                function ContentEditableAdapter(conf) {
                    _super.call(this, conf);
                    this.element = adapter.getElementFromAdapterConf(conf);
                }
                ContentEditableAdapter.prototype.getEditorElement = function () {
                    return this.element;
                };
                ContentEditableAdapter.prototype.getContent = function () {
                    return this.element.innerHTML;
                };
                ContentEditableAdapter.prototype.getEditorDocument = function () {
                    return this.element.ownerDocument;
                };
                ContentEditableAdapter.prototype.scrollElementIntoView = function (el) {
                    scrollIntoView(el, this.config.scrollOffsetY);
                };
                return ContentEditableAdapter;
            }(adapter.AbstractRichtextEditorAdapter));
            adapter.ContentEditableAdapter = ContentEditableAdapter;
        })(adapter = plugins.adapter || (plugins.adapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var adapter;
        (function (adapter) {
            'use strict';
            var lookupMatches = acrolinx.plugins.lookup.diffbased.lookupMatches;
            var _ = acrolinxLibs._;
            var getCompleteFlagLength = acrolinx.plugins.utils.getCompleteFlagLength;
            var fakeInputEvent = acrolinx.plugins.utils.fakeInputEvent;
            var scrollIntoView = acrolinx.plugins.utils.scrollIntoView;
            var InputAdapter = (function () {
                function InputAdapter(conf) {
                    this.element = adapter.getElementFromAdapterConf(conf);
                    this.config = conf;
                }
                InputAdapter.prototype.getContent = function () {
                    return this.element.value;
                };
                InputAdapter.prototype.getCurrentText = function () {
                    return this.getContent();
                };
                InputAdapter.prototype.getFormat = function () {
                    return 'TEXT';
                };
                InputAdapter.prototype.extractContentForCheck = function () {
                    this.html = this.getContent();
                    this.currentHtmlChecking = this.html;
                    return { content: this.html };
                };
                InputAdapter.prototype.registerCheckResult = function (checkResult) {
                };
                InputAdapter.prototype.registerCheckCall = function (checkInfo) {
                };
                InputAdapter.prototype.scrollAndSelect = function (matches) {
                    var newBegin = matches[0].range[0];
                    var matchLength = getCompleteFlagLength(matches);
                    var el = this.element;
                    if (el.clientHeight < el.scrollHeight) {
                        var text = this.element.value;
                        el.value = text.slice(0, newBegin);
                        el.focus();
                        el.scrollTop = 1e9;
                        var cursorScrollTop = el.scrollTop;
                        el.value = text;
                        if (cursorScrollTop > 0) {
                            el.scrollTop = cursorScrollTop + el.clientHeight / 2;
                        }
                    }
                    el.setSelectionRange(newBegin, newBegin + matchLength);
                    el.focus();
                    scrollIntoView(el, this.config.scrollOffsetY);
                };
                InputAdapter.prototype.selectRanges = function (checkId, matches) {
                    this.selectMatches(checkId, matches);
                };
                InputAdapter.prototype.selectMatches = function (checkId, matches) {
                    var alignedMatches = lookupMatches(this.currentHtmlChecking, this.getCurrentText(), matches, 'TEXT');
                    if (_.isEmpty(alignedMatches)) {
                        throw 'Selected flagged content is modified.';
                    }
                    this.scrollAndSelect(alignedMatches);
                    return alignedMatches;
                };
                InputAdapter.prototype.replaceAlignedMatches = function (matches) {
                    var reversedMatches = _.clone(matches).reverse();
                    var el = this.element;
                    var text = el.value;
                    for (var _i = 0, reversedMatches_2 = reversedMatches; _i < reversedMatches_2.length; _i++) {
                        var match = reversedMatches_2[_i];
                        text = text.slice(0, match.range[0]) + match.originalMatch.replacement + text.slice(match.range[1]);
                    }
                    el.value = text;
                };
                InputAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    var alignedMatches = this.selectMatches(checkId, matchesWithReplacement);
                    this.scrollAndSelect(alignedMatches);
                    this.replaceAlignedMatches(alignedMatches);
                    var startOfSelection = alignedMatches[0].range[0];
                    var replacement = alignedMatches.map(function (m) { return m.originalMatch.replacement; }).join('');
                    this.element.setSelectionRange(startOfSelection, startOfSelection + replacement.length);
                    fakeInputEvent(this.element);
                };
                return InputAdapter;
            }());
            adapter.InputAdapter = InputAdapter;
        })(adapter = plugins.adapter || (plugins.adapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var utils;
        (function (utils) {
            var HTML_ESCAPES = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
                '`': '&#96;'
            };
            function escapeHtmlCharacters(text) {
                var escapedText = '';
                var backwardAlignment = [];
                var currentDiffOffset = 0;
                for (var i = 0; i < text.length; i++) {
                    var char = text[i];
                    var escapedChar = HTML_ESCAPES[char];
                    if (escapedChar) {
                        var additionalChars = escapedChar.length - 1;
                        currentDiffOffset = currentDiffOffset - additionalChars;
                        backwardAlignment.push({
                            oldPosition: escapedText.length + escapedChar.length,
                            diffOffset: currentDiffOffset
                        });
                    }
                    escapedText = escapedText + (escapedChar || char);
                }
                return { escapedText: escapedText, backwardAlignment: backwardAlignment };
            }
            utils.escapeHtmlCharacters = escapeHtmlCharacters;
        })(utils = plugins.utils || (plugins.utils = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var adapter;
        (function (adapter_2) {
            'use strict';
            var escapeHtmlCharacters = acrolinx.plugins.utils.escapeHtmlCharacters;
            var findNewIndex = acrolinx.plugins.utils.findNewIndex;
            var _ = acrolinxLibs._;
            function createStartTag(wrapper, id) {
                var allAttributes = _.assign({}, wrapper.attributes, { id: id });
                var allAttributesString = _.map(allAttributes, function (value, key) { return (key + "=\"" + _.escape(value) + "\""); }).join(' ');
                return "<" + wrapper.tagName + " " + allAttributesString + ">";
            }
            function mapBackRangeOfEscapedText(escapeResult, range) {
                return [
                    findNewIndex(escapeResult.backwardAlignment, range[0]),
                    findNewIndex(escapeResult.backwardAlignment, range[1])
                ];
            }
            var MultiEditorAdapter = (function () {
                function MultiEditorAdapter(conf) {
                    this.config = conf;
                    this.adapters = [];
                }
                MultiEditorAdapter.prototype.addSingleAdapter = function (singleAdapter, opts, id) {
                    if (opts === void 0) { opts = {}; }
                    if (id === void 0) { id = 'acrolinx_integration' + this.adapters.length; }
                    this.adapters.push({
                        id: id, adapter: singleAdapter, wrapper: {
                            tagName: opts.tagName || 'div',
                            attributes: opts.attributes || {}
                        }
                    });
                };
                MultiEditorAdapter.prototype.extractContentForCheck = function () {
                    var _this = this;
                    var Q = acrolinxLibs.Q;
                    var deferred = Q.defer();
                    var contentExtractionResults = this.adapters.map(function (adapter) { return adapter.adapter.extractContentForCheck(); });
                    Q.all(contentExtractionResults).then(function (results) {
                        var html = '';
                        for (var i = 0; i < _this.adapters.length; i++) {
                            var el = _this.adapters[i];
                            var tagName = el.wrapper.tagName;
                            var startText = createStartTag(el.wrapper, el.id);
                            var isText = el.adapter.getFormat ? el.adapter.getFormat() === 'TEXT' : false;
                            var adapterContent = results[i].content;
                            var elHtml = void 0;
                            if (isText) {
                                el.escapeResult = escapeHtmlCharacters(adapterContent);
                                elHtml = el.escapeResult.escapedText;
                            }
                            else {
                                elHtml = adapterContent;
                            }
                            var newTag = startText + elHtml + '</' + tagName + '>';
                            el.start = html.length + startText.length;
                            el.end = html.length + startText.length + elHtml.length;
                            html += newTag;
                        }
                        var contentExtractionResult = { content: html };
                        deferred.resolve(contentExtractionResult);
                    });
                    return deferred.promise;
                };
                MultiEditorAdapter.prototype.registerCheckCall = function (checkInfo) {
                };
                MultiEditorAdapter.prototype.registerCheckResult = function (checkResult) {
                    this.checkResult = checkResult;
                    this.adapters.forEach(function (entry) {
                        entry.adapter.registerCheckResult(checkResult);
                    });
                };
                MultiEditorAdapter.prototype.selectRanges = function (checkId, matches) {
                    var map = this.remapMatches(matches);
                    for (var id in map) {
                        map[id].adapter.selectRanges(checkId, map[id].matches);
                    }
                };
                MultiEditorAdapter.prototype.remapMatches = function (matches) {
                    var map = {};
                    for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
                        var match = matches_1[_i];
                        var registeredAdapter = this.getAdapterForMatch(match);
                        if (!map.hasOwnProperty(registeredAdapter.id)) {
                            map[registeredAdapter.id] = { matches: [], adapter: registeredAdapter.adapter };
                        }
                        var remappedMatch = _.clone(match);
                        var rangeInsideWrapper = [match.range[0] - registeredAdapter.start, match.range[1] - registeredAdapter.start];
                        remappedMatch.range = registeredAdapter.escapeResult ?
                            mapBackRangeOfEscapedText(registeredAdapter.escapeResult, rangeInsideWrapper) : rangeInsideWrapper;
                        map[registeredAdapter.id].matches.push(remappedMatch);
                    }
                    return map;
                };
                MultiEditorAdapter.prototype.getAdapterForMatch = function (match) {
                    return _.find(this.adapters, function (adapter) { return (match.range[0] >= adapter.start) && (match.range[1] <= adapter.end); });
                };
                MultiEditorAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    var map = this.remapMatches(matchesWithReplacement);
                    for (var id in map) {
                        map[id].adapter.replaceRanges(checkId, map[id].matches);
                    }
                };
                return MultiEditorAdapter;
            }());
            adapter_2.MultiEditorAdapter = MultiEditorAdapter;
        })(adapter = plugins.adapter || (plugins.adapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var adapter;
        (function (adapter) {
            'use strict';
            var TinyMCEAdapter = (function (_super) {
                __extends(TinyMCEAdapter, _super);
                function TinyMCEAdapter(conf) {
                    _super.call(this, conf);
                    this.editorId = conf.editorId;
                }
                TinyMCEAdapter.prototype.getEditor = function () {
                    return tinymce.get(this.editorId);
                };
                TinyMCEAdapter.prototype.getContent = function () {
                    return this.getEditor().getContent();
                };
                TinyMCEAdapter.prototype.getEditorDocument = function () {
                    return this.getEditor().getDoc();
                };
                TinyMCEAdapter.prototype.scrollToCurrentSelection = function () {
                    var selection = this.getEditorDocument().getSelection();
                    if (selection) {
                        try {
                            var originalRange = selection.getRangeAt(0);
                            var startContainer = originalRange.startContainer, startOffset = originalRange.startOffset, endContainer = originalRange.endContainer, endOffset = originalRange.endOffset;
                            selection.collapseToStart();
                            this.getEditor().insertContent('');
                            var restoredRange = this.getEditorDocument().createRange();
                            restoredRange.setStart(startContainer, startOffset);
                            restoredRange.setEnd(endContainer, endOffset);
                            selection.removeAllRanges();
                            selection.addRange(restoredRange);
                        }
                        catch (error) {
                            console.log('Scrolling Error: ', error);
                        }
                    }
                };
                return TinyMCEAdapter;
            }(adapter.AbstractRichtextEditorAdapter));
            adapter.TinyMCEAdapter = TinyMCEAdapter;
        })(adapter = plugins.adapter || (plugins.adapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var adapter;
        (function (adapter) {
            'use strict';
            var TinyMCEWordpressAdapter = (function (_super) {
                __extends(TinyMCEWordpressAdapter, _super);
                function TinyMCEWordpressAdapter() {
                    _super.apply(this, arguments);
                }
                TinyMCEWordpressAdapter.prototype.getEditor = function () {
                    return tinymce.get(this.editorId);
                };
                TinyMCEWordpressAdapter.prototype.getContent = function () {
                    return this.getEditor().getContent();
                };
                TinyMCEWordpressAdapter.prototype.getEditorDocument = function () {
                    return this.getEditor().getDoc();
                };
                TinyMCEWordpressAdapter.prototype.scrollToCurrentSelection = function () {
                    var isOverflow = false;
                    var editorBody = this.getEditor().getBody();
                    var eleCss = editorBody.getAttribute('style');
                    if (eleCss && eleCss.indexOf('overflow-y: hidden') !== -1) {
                        isOverflow = true;
                    }
                    var parentWidth = this.getEditor().getContainer().clientWidth;
                    var bodyClientWidthWithMargin = editorBody.scrollWidth;
                    var hasVerticalScrollbar = parentWidth > bodyClientWidthWithMargin;
                    if (hasVerticalScrollbar && !isOverflow) {
                        _super.prototype.scrollToCurrentSelection.call(this);
                    }
                    else {
                        this.scrollToCurrentSelectionWithGlobalScrollbar();
                    }
                };
                TinyMCEWordpressAdapter.prototype.scrollToCurrentSelectionWithGlobalScrollbar = function () {
                    var selection1 = this.getEditorDocument().getSelection();
                    if (selection1) {
                        try {
                            this.scrollIntoViewWithGlobalScrollbar(selection1);
                        }
                        catch (error) {
                            console.log('Scrolling Error: ', error);
                        }
                    }
                };
                TinyMCEWordpressAdapter.prototype.scrollIntoViewWithGlobalScrollbar = function (sel) {
                    var range = sel.getRangeAt(0);
                    var tmp = range.cloneRange();
                    tmp.collapse(false);
                    var text = this.getEditorDocument().createElement('span');
                    tmp.insertNode(text);
                    var ypos = text.getClientRects()[0].top;
                    window.scrollTo(0, ypos);
                    text.parentNode.removeChild(text);
                };
                return TinyMCEWordpressAdapter;
            }(adapter.TinyMCEAdapter));
            adapter.TinyMCEWordpressAdapter = TinyMCEWordpressAdapter;
        })(adapter = plugins.adapter || (plugins.adapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var autobind;
        (function (autobind) {
            'use strict';
            var isIFrame = acrolinx.plugins.utils.isIFrame;
            var InputAdapter = acrolinx.plugins.adapter.InputAdapter;
            var ContentEditableAdapter = acrolinx.plugins.adapter.ContentEditableAdapter;
            var EDITABLE_ELEMENTS_SELECTOR = [
                'input:not([type])',
                'input[type=""]',
                'input[type=text]',
                '[contenteditable="true"]',
                '[contenteditable="plaintext-only"]',
                'textarea',
                'iframe'
            ].join(', ');
            function isVisible(el) {
                return el.offsetHeight > 0 && el.offsetWidth > 0;
            }
            function getEditableElements(doc) {
                if (doc === void 0) { doc = document; }
                var visibleElements = _.filter(doc.querySelectorAll(EDITABLE_ELEMENTS_SELECTOR), isVisible);
                return _.flatMap(visibleElements, function (el) {
                    if (isIFrame(el)) {
                        try {
                            return el.contentDocument ? getEditableElements(el.contentDocument) : [];
                        }
                        catch (err) {
                            return [];
                        }
                    }
                    else {
                        return [el];
                    }
                });
            }
            function bindAdaptersForCurrentPage(conf) {
                if (conf === void 0) { conf = {}; }
                return getEditableElements().map(function (editable) {
                    var adapterConf = _.assign({}, conf, { element: editable });
                    if (editable.nodeName === 'INPUT' || editable.nodeName === 'TEXTAREA') {
                        return new InputAdapter(adapterConf);
                    }
                    else {
                        return new ContentEditableAdapter(adapterConf);
                    }
                });
            }
            autobind.bindAdaptersForCurrentPage = bindAdaptersForCurrentPage;
        })(autobind = plugins.autobind || (plugins.autobind = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var floatingSidebar;
        (function (floatingSidebar) {
            'use strict';
            floatingSidebar.SIDEBAR_ID = 'acrolinxFloatingSidebar';
            floatingSidebar.SIDEBAR_CONTAINER_ID = 'acrolinxSidebarContainer';
            floatingSidebar.SIDEBAR_DRAG_OVERLAY_ID = 'acrolinxDragOverlay';
            floatingSidebar.SIDEBAR_GLASS_PANE_ID = 'acrolinxFloatingSidebarGlassPane';
            var initialPos = {
                top: 100,
                left: 100
            };
            function addStyles() {
                var styleTag = document.createElement('style');
                var head = document.querySelector('head');
                styleTag.innerHTML = "\n      #" + floatingSidebar.SIDEBAR_ID + " {\n        top: " + initialPos.top + "px;\n        left: " + initialPos.left + "px;\n        position: fixed;\n        width: 300px;\n        padding-top: 20px;\n        cursor: move;\n        background: #3e96db;\n        height: 500px;\n        box-shadow: 5px 5px 30px rgba(0, 0, 0, 0.3);\n        border-radius: 3px;\n        user-select: none;\n        z-index: 10000;\n          -moz-user-select: none;\n          -webkit-user-select: none;\n          -ms-user-select: none;\n      }\n  \n      #" + floatingSidebar.SIDEBAR_ID + " #" + floatingSidebar.SIDEBAR_CONTAINER_ID + ",\n      #" + floatingSidebar.SIDEBAR_ID + " #acrolinxDragOverlay,\n      #" + floatingSidebar.SIDEBAR_ID + " #" + floatingSidebar.SIDEBAR_CONTAINER_ID + " iframe {\n        position: relative;\n        background: white;\n        height: 100%;\n        border: none;\n      }\n      \n      #" + floatingSidebar.SIDEBAR_ID + " #" + floatingSidebar.SIDEBAR_DRAG_OVERLAY_ID + " {\n        position: absolute;\n        top: 20px;\n        left: 0;\n        height: 300px;\n        width: 300px;\n        background: transparent;\n        z-index: 10001;\n      }\n       \n      #" + floatingSidebar.SIDEBAR_GLASS_PANE_ID + " {\n        position: fixed;\n        width: 100%;\n        height: 100%;\n        margin: 0;\n        padding: 0;\n        top: 0;\n        left: 0;\n        background: white;\n        opacity: 0.6;\n        z-index: 9999;\n      }\n    ";
                head.appendChild(styleTag);
            }
            function createDiv(id) {
                var el = document.createElement('div');
                el.id = id;
                return el;
            }
            function hide(el) {
                el.style.display = 'none';
            }
            function show(el) {
                el.style.display = 'block';
            }
            function initFloatingSidebar() {
                var floatingSidebarElement = createDiv(floatingSidebar.SIDEBAR_ID);
                var dragOverlay = createDiv(floatingSidebar.SIDEBAR_DRAG_OVERLAY_ID);
                var glassPane = createDiv(floatingSidebar.SIDEBAR_GLASS_PANE_ID);
                var body = document.querySelector('body');
                var isDragging = false;
                var relativeMouseDownX = 0;
                var relativeMouseDownY = 0;
                function move(xpos, ypos) {
                    floatingSidebarElement.style.left = xpos + 'px';
                    floatingSidebarElement.style.top = ypos + 'px';
                }
                function onEndDrag() {
                    console.log('End drag!!!');
                    hide(dragOverlay);
                    hide(glassPane);
                    isDragging = false;
                }
                document.addEventListener('mousemove', function (event) {
                    if (isDragging) {
                        move(Math.max(event.clientX - relativeMouseDownX, 0), Math.max(event.clientY - relativeMouseDownY, 0));
                    }
                });
                floatingSidebarElement.addEventListener('mousedown', function (event) {
                    var divLeft = parseInt(floatingSidebarElement.style.left.replace('px', '')) || initialPos.left;
                    var divTop = parseInt(floatingSidebarElement.style.top.replace('px', '')) || initialPos.top;
                    relativeMouseDownX = event.clientX - divLeft;
                    relativeMouseDownY = event.clientY - divTop;
                    isDragging = true;
                    show(dragOverlay);
                    show(glassPane);
                });
                document.addEventListener('mouseup', onEndDrag);
                floatingSidebarElement.appendChild(createDiv(floatingSidebar.SIDEBAR_CONTAINER_ID));
                hide(dragOverlay);
                floatingSidebarElement.appendChild(dragOverlay);
                addStyles();
                body.appendChild(floatingSidebarElement);
                hide(glassPane);
                body.appendChild(glassPane);
            }
            floatingSidebar.initFloatingSidebar = initFloatingSidebar;
        })(floatingSidebar = plugins.floatingSidebar || (plugins.floatingSidebar = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var messageAdapter;
        (function (messageAdapter) {
            'use strict';
            function postCommandAsMessage(window, command) {
                var args = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    args[_i - 2] = arguments[_i];
                }
                window.postMessage({ command: command, args: args }, '*');
            }
            function injectPostCommandAsMessage(window, object) {
                var _loop_1 = function(key) {
                    var originalMethod = object[key];
                    object[key] = function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i - 0] = arguments[_i];
                        }
                        postCommandAsMessage.apply(void 0, [window, key].concat(args));
                        return originalMethod.apply(object, args);
                    };
                };
                for (var key in object) {
                    _loop_1(key);
                }
            }
            function connectAcrolinxPluginToMessages(acrolinxPlugin, sidebarWindowIframe) {
                var acrolinxPluginAny = acrolinxPlugin;
                var sidebar = {
                    init: function (initParameters) {
                    },
                    checkGlobal: function (documentContent, options) {
                        return { checkId: 'dummyCheckId' };
                    },
                    onGlobalCheckRejected: function () {
                    },
                    invalidateRanges: function (invalidCheckedDocumentRanges) {
                    },
                    onVisibleRangesChanged: function (checkedDocumentRanges) {
                    }
                };
                injectPostCommandAsMessage(sidebarWindowIframe.contentWindow, sidebar);
                function receiveMessage(event) {
                    var _a = event.data, command = _a.command, args = _a.args;
                    if (acrolinxPluginAny[command]) {
                        if (command === 'requestInit') {
                            acrolinxPluginAny.requestInit(sidebar);
                        }
                        else {
                            acrolinxPluginAny[command].apply(acrolinxPluginAny, args);
                        }
                    }
                }
                addEventListener('message', receiveMessage, false);
            }
            messageAdapter.connectAcrolinxPluginToMessages = connectAcrolinxPluginToMessages;
            function createPluginMessageAdapter() {
                var windowAny = window;
                function receiveMessage(event) {
                    var _a = event.data, command = _a.command, args = _a.args;
                    if (windowAny.acrolinxSidebar[command]) {
                        windowAny.acrolinxSidebar[command].apply(windowAny.acrolinxSidebar, args);
                    }
                }
                addEventListener('message', receiveMessage, false);
                var acrolinxSidebarPlugin = {
                    requestInit: function () {
                    },
                    onInitFinished: function (initFinishedResult) {
                    },
                    configure: function (configuration) {
                    },
                    requestGlobalCheck: function () {
                    },
                    onCheckResult: function (checkResult) {
                    },
                    selectRanges: function (checkId, matches) {
                    },
                    replaceRanges: function (checkId, matchesWithReplacement) {
                    },
                    download: function (download) {
                    },
                    openWindow: function (urlSpec) {
                    }
                };
                injectPostCommandAsMessage(window.parent, acrolinxSidebarPlugin);
                return acrolinxSidebarPlugin;
            }
            messageAdapter.createPluginMessageAdapter = createPluginMessageAdapter;
        })(messageAdapter = plugins.messageAdapter || (plugins.messageAdapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var utils;
        (function (utils) {
            'use strict';
            utils.SIDEBAR_URL = 'https://acrolinx-sidebar-classic.s3.amazonaws.com/v14/prod/';
            function createCSSLinkElement(href) {
                var el = document.createElement('link');
                el.rel = 'stylesheet';
                el.href = href;
                return el;
            }
            function createScriptElement(src) {
                var el = document.createElement('script');
                el.src = src;
                el.type = 'text/javascript';
                el.async = false;
                el.defer = false;
                return el;
            }
            function loadSidebarCode(sidebarUrl) {
                if (sidebarUrl === void 0) { sidebarUrl = utils.SIDEBAR_URL; }
                var sidebarBaseUrl = sidebarUrl;
                var getAbsoluteAttributeValue = function (s) { return s.replace(/^.*"(.*)".*$/g, sidebarBaseUrl + '$1'); };
                utils.fetch(sidebarBaseUrl + 'index.html', function (sidebarHtml) {
                    var withoutComments = sidebarHtml.replace(/<!--[\s\S]*?-->/g, '');
                    var head = document.querySelector('head');
                    var css = withoutComments
                        .match(/href=".*?"/g)
                        .map(getAbsoluteAttributeValue);
                    css.forEach(function (ref) {
                        head.appendChild(createCSSLinkElement(ref));
                    });
                    var scripts = withoutComments
                        .match(/src=".*?"/g)
                        .map(getAbsoluteAttributeValue);
                    scripts.forEach(function (ref) {
                        head.appendChild(createScriptElement(ref));
                    });
                });
            }
            utils.loadSidebarCode = loadSidebarCode;
            function loadSidebarIntoIFrame(config, sidebarIFrameElement, onSidebarLoaded) {
                var sidebarBaseUrl = config.sidebarUrl || utils.SIDEBAR_URL;
                var completeSidebarUrl = sidebarBaseUrl + 'index.html';
                if (config.useMessageAdapter || (config.useSidebarFromSameOriginDirectly && utils.isFromSameOrigin(sidebarBaseUrl))) {
                    sidebarIFrameElement.addEventListener('load', onSidebarLoaded);
                    sidebarIFrameElement.src = completeSidebarUrl;
                }
                else {
                    utils.fetch(completeSidebarUrl, function (sidebarHtml) {
                        var sidebarContentWindow = sidebarIFrameElement.contentWindow;
                        var sidebarHtmlWithAbsoluteLinks = sidebarHtml
                            .replace(/src="/g, 'src="' + sidebarBaseUrl)
                            .replace(/href="/g, 'href="' + sidebarBaseUrl);
                        sidebarContentWindow.document.open();
                        sidebarContentWindow.document.write(sidebarHtmlWithAbsoluteLinks);
                        sidebarContentWindow.document.close();
                        onSidebarLoaded();
                    });
                }
            }
            utils.loadSidebarIntoIFrame = loadSidebarIntoIFrame;
        })(utils = plugins.utils || (plugins.utils = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        'use strict';
        var _ = acrolinxLibs._;
        var initFloatingSidebar = acrolinx.plugins.floatingSidebar.initFloatingSidebar;
        var connectAcrolinxPluginToMessages = acrolinx.plugins.messageAdapter.connectAcrolinxPluginToMessages;
        var loadSidebarIntoIFrame = acrolinx.plugins.utils.loadSidebarIntoIFrame;
        var AutoBindAdapter = acrolinx.plugins.adapter.AutoBindAdapter;
        var clientComponents = [
            {
                id: 'com.acrolinx.sidebarexample',
                name: 'Acrolinx Sidebar Example Client',
                version: '1.2.3.999',
                category: 'MAIN'
            }
        ];
        function isPromise(result) {
            return result.then !== undefined;
        }
        function initAcrolinxSamplePlugin(config, editorAdapter) {
            var sidebarContainer = document.getElementById(config.sidebarContainerId);
            if (!sidebarContainer) {
                throw new Error("Acrolinx can't find an element with the configured sidebarContainerId \"" + config.sidebarContainerId + "\".");
            }
            var sidebarIFrameElement = document.createElement('iframe');
            sidebarContainer.appendChild(sidebarIFrameElement);
            var sidebarContentWindow = sidebarIFrameElement.contentWindow;
            var adapter = editorAdapter;
            function onSidebarLoaded() {
                var acrolinxSidebar;
                function initSidebarOnPremise() {
                    acrolinxSidebar.init(_.assign({}, {
                        showServerSelector: true,
                        clientComponents: clientComponents
                    }, config));
                }
                function requestGlobalCheckSync(html, format, documentReference) {
                    if (html.hasOwnProperty('error')) {
                        window.alert(html.error);
                    }
                    else {
                        var checkInfo = acrolinxSidebar.checkGlobal(html.content, {
                            inputFormat: format || 'HTML',
                            requestDescription: {
                                documentReference: documentReference || 'filename.html'
                            }
                        });
                        adapter.registerCheckCall(checkInfo);
                    }
                }
                var acrolinxSidebarPlugin = {
                    requestInit: function (acrolinxSidebarArg) {
                        acrolinxSidebar = acrolinxSidebarArg || sidebarContentWindow.acrolinxSidebar;
                        console.log('requestInit');
                        initSidebarOnPremise();
                    },
                    onInitFinished: function (initFinishedResult) {
                        console.log('onInitFinished: ', initFinishedResult);
                        if (initFinishedResult.error) {
                            window.alert(initFinishedResult.error.message);
                        }
                    },
                    configure: function (configuration) {
                        console.log('configure: ', configuration);
                    },
                    requestGlobalCheck: function () {
                        console.log('requestGlobalCheck');
                        var contentExtractionResult = adapter.extractContentForCheck();
                        var pFormat = adapter.getFormat ? adapter.getFormat() : null;
                        var pDocumentReference = adapter.getDocumentReference ? adapter.getDocumentReference() : null;
                        if (isPromise(contentExtractionResult)) {
                            contentExtractionResult.then(function (html) {
                                requestGlobalCheckSync(html, pFormat, pDocumentReference);
                            });
                        }
                        else {
                            requestGlobalCheckSync(contentExtractionResult, pFormat, pDocumentReference);
                        }
                    },
                    onCheckResult: function (checkResult) {
                        return adapter.registerCheckResult(checkResult);
                    },
                    selectRanges: function (checkId, matches) {
                        console.log('selectRanges: ', checkId, matches);
                        try {
                            adapter.selectRanges(checkId, matches);
                        }
                        catch (msg) {
                            console.log(msg);
                            acrolinxSidebar.invalidateRanges(matches.map(function (match) {
                                return {
                                    checkId: checkId,
                                    range: match.range
                                };
                            }));
                        }
                    },
                    replaceRanges: function (checkId, matchesWithReplacement) {
                        console.log('replaceRanges: ', checkId, matchesWithReplacement);
                        try {
                            adapter.replaceRanges(checkId, matchesWithReplacement);
                        }
                        catch (msg) {
                            console.log(msg);
                            acrolinxSidebar.invalidateRanges(matchesWithReplacement.map(function (match) {
                                return {
                                    checkId: checkId,
                                    range: match.range
                                };
                            }));
                        }
                    },
                    download: function (download) {
                        console.log('download: ', download.url, download);
                        window.open(download.url);
                    },
                    openWindow: function (_a) {
                        var url = _a.url;
                        window.open(url);
                    }
                };
                if (config.onSidebarWindowLoaded) {
                    config.onSidebarWindowLoaded(sidebarContentWindow);
                }
                console.log('Install acrolinxPlugin in sidebar.');
                if (config.useMessageAdapter) {
                    connectAcrolinxPluginToMessages(acrolinxSidebarPlugin, sidebarIFrameElement);
                }
                else {
                    sidebarContentWindow.acrolinxPlugin = acrolinxSidebarPlugin;
                }
            }
            loadSidebarIntoIFrame(config, sidebarIFrameElement, onSidebarLoaded);
        }
        var AcrolinxPlugin = (function () {
            function AcrolinxPlugin(conf) {
                this.config = conf;
            }
            AcrolinxPlugin.prototype.registerAdapter = function (adapter) {
                this.adapter = adapter;
            };
            AcrolinxPlugin.prototype.init = function () {
                initAcrolinxSamplePlugin(this.config, this.adapter);
            };
            return AcrolinxPlugin;
        }());
        plugins.AcrolinxPlugin = AcrolinxPlugin;
        function autoBindFloatingSidebar(basicConf) {
            var conf = _.assign({}, basicConf, {
                sidebarContainerId: plugins.floatingSidebar.SIDEBAR_CONTAINER_ID
            });
            initFloatingSidebar();
            var acrolinxPlugin = new acrolinx.plugins.AcrolinxPlugin(conf);
            acrolinxPlugin.registerAdapter(new AutoBindAdapter(conf));
            acrolinxPlugin.init();
        }
        plugins.autoBindFloatingSidebar = autoBindFloatingSidebar;
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var utils;
        (function (utils) {
            var _ = acrolinxLibs._;
            function textMapping(text, domPositions) {
                return {
                    text: text,
                    domPositions: domPositions
                };
            }
            utils.textMapping = textMapping;
            function concatTextMappings(textMappings) {
                return {
                    text: textMappings.map(function (tm) { return tm.text; }).join(''),
                    domPositions: _.flatten(textMappings.map(function (tm) { return tm.domPositions; }))
                };
            }
            utils.concatTextMappings = concatTextMappings;
            function domPosition(node, offset) {
                return {
                    node: node,
                    offset: offset
                };
            }
            utils.domPosition = domPosition;
            function extractTextDomMapping(node) {
                return concatTextMappings(_.map(node.childNodes, function (child) {
                    switch (child.nodeType) {
                        case Node.ELEMENT_NODE:
                            return extractTextDomMapping(child);
                        case Node.TEXT_NODE:
                        default:
                            return textMapping(child.textContent, _.times(child.textContent.length, function (i) { return domPosition(child, i); }));
                    }
                }));
            }
            utils.extractTextDomMapping = extractTextDomMapping;
            function getEndDomPos(endIndex, domPositions) {
                var index = domPositions[Math.max(Math.min(endIndex, domPositions.length) - 1, 0)];
                return {
                    node: index.node,
                    offset: index.offset + 1
                };
            }
            utils.getEndDomPos = getEndDomPos;
        })(utils = plugins.utils || (plugins.utils = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
//# sourceMappingURL=acrolinx-sidebar-integration.js.map