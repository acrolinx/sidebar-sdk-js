(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

/**
 * Diff Match and Patch
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Computes the difference between two texts to create a patch.
 * Applies the patch onto another text, allowing for errors.
 * @author fraser@google.com (Neil Fraser)
 */

/**
 * Class containing the diff, match and patch methods.
 * @constructor
 */
function diff_match_patch() {

  // Defaults.
  // Redefine these in your program to override the defaults.

  // Number of seconds to map a diff before giving up (0 for infinity).
  this.Diff_Timeout = 1.0;
  // Cost of an empty edit operation in terms of edit characters.
  this.Diff_EditCost = 4;
  // At what point is no match declared (0.0 = perfection, 1.0 = very loose).
  this.Match_Threshold = 0.5;
  // How far to search for a match (0 = exact location, 1000+ = broad match).
  // A match this many characters away from the expected location will add
  // 1.0 to the score (0.0 is a perfect match).
  this.Match_Distance = 1000;
  // When deleting a large block of text (over ~64 characters), how close do
  // the contents have to be to match the expected contents. (0.0 = perfection,
  // 1.0 = very loose).  Note that Match_Threshold controls how closely the
  // end points of a delete need to match.
  this.Patch_DeleteThreshold = 0.5;
  // Chunk size for context length.
  this.Patch_Margin = 4;

  // The number of bits in an int.
  this.Match_MaxBits = 32;
}


//  DIFF FUNCTIONS


/**
 * The data structure representing a diff is an array of tuples:
 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
var DIFF_DELETE = -1;
var DIFF_INSERT = 1;
var DIFF_EQUAL = 0;

/** @typedef {{0: number, 1: string}} */
diff_match_patch.Diff;


/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean=} opt_checklines Optional speedup flag. If present and false,
 *     then don't run a line-level diff first to identify the changed areas.
 *     Defaults to true, which does a faster, slightly less optimal diff.
 * @param {number} opt_deadline Optional time when the diff should be complete
 *     by.  Used internally for recursive calls.  Users should set DiffTimeout
 *     instead.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 */
diff_match_patch.prototype.diff_main = function(text1, text2, opt_checklines,
    opt_deadline) {
  // Set a deadline by which time the diff must be complete.
  if (typeof opt_deadline == 'undefined') {
    if (this.Diff_Timeout <= 0) {
      opt_deadline = Number.MAX_VALUE;
    } else {
      opt_deadline = (new Date).getTime() + this.Diff_Timeout * 1000;
    }
  }
  var deadline = opt_deadline;

  // Check for null inputs.
  if (text1 == null || text2 == null) {
    throw new Error('Null input. (diff_main)');
  }

  // Check for equality (speedup).
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

  // Trim off common prefix (speedup).
  var commonlength = this.diff_commonPrefix(text1, text2);
  var commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength);

  // Trim off common suffix (speedup).
  commonlength = this.diff_commonSuffix(text1, text2);
  var commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength);

  // Compute the diff on the middle block.
  var diffs = this.diff_compute_(text1, text2, checklines, deadline);

  // Restore the prefix and suffix.
  if (commonprefix) {
    diffs.unshift([DIFF_EQUAL, commonprefix]);
  }
  if (commonsuffix) {
    diffs.push([DIFF_EQUAL, commonsuffix]);
  }
  this.diff_cleanupMerge(diffs);
  return diffs;
};


/**
 * Find the differences between two texts.  Assumes that the texts do not
 * have any common prefix or suffix.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean} checklines Speedup flag.  If false, then don't run a
 *     line-level diff first to identify the changed areas.
 *     If true, then run a faster, slightly less optimal diff.
 * @param {number} deadline Time when the diff should be complete by.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_compute_ = function(text1, text2, checklines,
    deadline) {
  var diffs;

  if (!text1) {
    // Just add some text (speedup).
    return [[DIFF_INSERT, text2]];
  }

  if (!text2) {
    // Just delete some text (speedup).
    return [[DIFF_DELETE, text1]];
  }

  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  var i = longtext.indexOf(shorttext);
  if (i != -1) {
    // Shorter text is inside the longer text (speedup).
    diffs = [[DIFF_INSERT, longtext.substring(0, i)],
             [DIFF_EQUAL, shorttext],
             [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
    // Swap insertions for deletions if diff is reversed.
    if (text1.length > text2.length) {
      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
    }
    return diffs;
  }

  if (shorttext.length == 1) {
    // Single character string.
    // After the previous speedup, the character can't be an equality.
    return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  }

  // Check to see if the problem can be split in two.
  var hm = this.diff_halfMatch_(text1, text2);
  if (hm) {
    // A half-match was found, sort out the return data.
    var text1_a = hm[0];
    var text1_b = hm[1];
    var text2_a = hm[2];
    var text2_b = hm[3];
    var mid_common = hm[4];
    // Send both pairs off for separate processing.
    var diffs_a = this.diff_main(text1_a, text2_a, checklines, deadline);
    var diffs_b = this.diff_main(text1_b, text2_b, checklines, deadline);
    // Merge the results.
    return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
  }

  if (checklines && text1.length > 100 && text2.length > 100) {
    return this.diff_lineMode_(text1, text2, deadline);
  }

  return this.diff_bisect_(text1, text2, deadline);
};


/**
 * Do a quick line-level diff on both strings, then rediff the parts for
 * greater accuracy.
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} deadline Time when the diff should be complete by.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_lineMode_ = function(text1, text2, deadline) {
  // Scan the text on a line-by-line basis first.
  var a = this.diff_linesToChars_(text1, text2);
  text1 = a.chars1;
  text2 = a.chars2;
  var linearray = a.lineArray;

  var diffs = this.diff_main(text1, text2, false, deadline);

  // Convert the diff back to original text.
  this.diff_charsToLines_(diffs, linearray);
  // Eliminate freak matches (e.g. blank lines)
  this.diff_cleanupSemantic(diffs);

  // Rediff any replacement blocks, this time character-by-character.
  // Add a dummy entry at the end.
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
        // Upon reaching an equality, check for prior redundancies.
        if (count_delete >= 1 && count_insert >= 1) {
          // Delete the offending records and add the merged ones.
          diffs.splice(pointer - count_delete - count_insert,
                       count_delete + count_insert);
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
  diffs.pop();  // Remove the dummy entry at the end.

  return diffs;
};


/**
 * Find the 'middle snake' of a diff, split the problem in two
 * and return the recursively constructed diff.
 * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} deadline Time at which to bail if not yet complete.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_bisect_ = function(text1, text2, deadline) {
  // Cache the text lengths to prevent multiple calls.
  var text1_length = text1.length;
  var text2_length = text2.length;
  var max_d = Math.ceil((text1_length + text2_length) / 2);
  var v_offset = max_d;
  var v_length = 2 * max_d;
  var v1 = new Array(v_length);
  var v2 = new Array(v_length);
  // Setting all elements to -1 is faster in Chrome & Firefox than mixing
  // integers and undefined.
  for (var x = 0; x < v_length; x++) {
    v1[x] = -1;
    v2[x] = -1;
  }
  v1[v_offset + 1] = 0;
  v2[v_offset + 1] = 0;
  var delta = text1_length - text2_length;
  // If the total number of characters is odd, then the front path will collide
  // with the reverse path.
  var front = (delta % 2 != 0);
  // Offsets for start and end of k loop.
  // Prevents mapping of space beyond the grid.
  var k1start = 0;
  var k1end = 0;
  var k2start = 0;
  var k2end = 0;
  for (var d = 0; d < max_d; d++) {
    // Bail out if deadline is reached.
    if ((new Date()).getTime() > deadline) {
      break;
    }

    // Walk the front path one step.
    for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      var k1_offset = v_offset + k1;
      var x1;
      if (k1 == -d || (k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
        x1 = v1[k1_offset + 1];
      } else {
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
        // Ran off the right of the graph.
        k1end += 2;
      } else if (y1 > text2_length) {
        // Ran off the bottom of the graph.
        k1start += 2;
      } else if (front) {
        var k2_offset = v_offset + delta - k1;
        if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
          // Mirror x2 onto top-left coordinate system.
          var x2 = text1_length - v2[k2_offset];
          if (x1 >= x2) {
            // Overlap detected.
            return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
          }
        }
      }
    }

    // Walk the reverse path one step.
    for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      var k2_offset = v_offset + k2;
      var x2;
      if (k2 == -d || (k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
        x2 = v2[k2_offset + 1];
      } else {
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
        // Ran off the left of the graph.
        k2end += 2;
      } else if (y2 > text2_length) {
        // Ran off the top of the graph.
        k2start += 2;
      } else if (!front) {
        var k1_offset = v_offset + delta - k2;
        if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
          var x1 = v1[k1_offset];
          var y1 = v_offset + x1 - k1_offset;
          // Mirror x2 onto top-left coordinate system.
          x2 = text1_length - x2;
          if (x1 >= x2) {
            // Overlap detected.
            return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
          }
        }
      }
    }
  }
  // Diff took too long and hit the deadline or
  // number of diffs equals number of characters, no commonality at all.
  return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
};


/**
 * Given the location of the 'middle snake', split the diff in two parts
 * and recurse.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} x Index of split point in text1.
 * @param {number} y Index of split point in text2.
 * @param {number} deadline Time at which to bail if not yet complete.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_bisectSplit_ = function(text1, text2, x, y,
    deadline) {
  var text1a = text1.substring(0, x);
  var text2a = text2.substring(0, y);
  var text1b = text1.substring(x);
  var text2b = text2.substring(y);

  // Compute both diffs serially.
  var diffs = this.diff_main(text1a, text2a, false, deadline);
  var diffsb = this.diff_main(text1b, text2b, false, deadline);

  return diffs.concat(diffsb);
};


/**
 * Split two texts into an array of strings.  Reduce the texts to a string of
 * hashes where each Unicode character represents one line.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {{chars1: string, chars2: string, lineArray: !Array.<string>}}
 *     An object containing the encoded text1, the encoded text2 and
 *     the array of unique strings.
 *     The zeroth element of the array of unique strings is intentionally blank.
 * @private
 */
diff_match_patch.prototype.diff_linesToChars_ = function(text1, text2) {
  var lineArray = [];  // e.g. lineArray[4] == 'Hello\n'
  var lineHash = {};   // e.g. lineHash['Hello\n'] == 4

  // '\x00' is a valid character, but various debuggers don't like it.
  // So we'll insert a junk entry to avoid generating a null character.
  lineArray[0] = '';

  /**
   * Split a text into an array of strings.  Reduce the texts to a string of
   * hashes where each Unicode character represents one line.
   * Modifies linearray and linehash through being a closure.
   * @param {string} text String to encode.
   * @return {string} Encoded string.
   * @private
   */
  function diff_linesToCharsMunge_(text) {
    var chars = '';
    // Walk the text, pulling out a substring for each line.
    // text.split('\n') would would temporarily double our memory footprint.
    // Modifying text would create many large strings to garbage collect.
    var lineStart = 0;
    var lineEnd = -1;
    // Keeping our own length variable is faster than looking it up.
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
      } else {
        chars += String.fromCharCode(lineArrayLength);
        lineHash[line] = lineArrayLength;
        lineArray[lineArrayLength++] = line;
      }
    }
    return chars;
  }

  var chars1 = diff_linesToCharsMunge_(text1);
  var chars2 = diff_linesToCharsMunge_(text2);
  return {chars1: chars1, chars2: chars2, lineArray: lineArray};
};


/**
 * Rehydrate the text in a diff from a string of line hashes to real lines of
 * text.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @param {!Array.<string>} lineArray Array of unique strings.
 * @private
 */
diff_match_patch.prototype.diff_charsToLines_ = function(diffs, lineArray) {
  for (var x = 0; x < diffs.length; x++) {
    var chars = diffs[x][1];
    var text = [];
    for (var y = 0; y < chars.length; y++) {
      text[y] = lineArray[chars.charCodeAt(y)];
    }
    diffs[x][1] = text.join('');
  }
};


/**
 * Determine the common prefix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the start of each
 *     string.
 */
diff_match_patch.prototype.diff_commonPrefix = function(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerstart = 0;
  while (pointermin < pointermid) {
    if (text1.substring(pointerstart, pointermid) ==
        text2.substring(pointerstart, pointermid)) {
      pointermin = pointermid;
      pointerstart = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
};


/**
 * Determine the common suffix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of each string.
 */
diff_match_patch.prototype.diff_commonSuffix = function(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 ||
      text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerend = 0;
  while (pointermin < pointermid) {
    if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
        text2.substring(text2.length - pointermid, text2.length - pointerend)) {
      pointermin = pointermid;
      pointerend = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
};


/**
 * Determine if the suffix of one string is the prefix of another.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of the first
 *     string and the start of the second string.
 * @private
 */
diff_match_patch.prototype.diff_commonOverlap_ = function(text1, text2) {
  // Cache the text lengths to prevent multiple calls.
  var text1_length = text1.length;
  var text2_length = text2.length;
  // Eliminate the null case.
  if (text1_length == 0 || text2_length == 0) {
    return 0;
  }
  // Truncate the longer string.
  if (text1_length > text2_length) {
    text1 = text1.substring(text1_length - text2_length);
  } else if (text1_length < text2_length) {
    text2 = text2.substring(0, text1_length);
  }
  var text_length = Math.min(text1_length, text2_length);
  // Quick check for the worst case.
  if (text1 == text2) {
    return text_length;
  }

  // Start by looking for a single character match
  // and increase length until no match is found.
  // Performance analysis: http://neil.fraser.name/news/2010/11/04/
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


/**
 * Do the two texts share a substring which is at least half the length of the
 * longer text?
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string>} Five element Array, containing the prefix of
 *     text1, the suffix of text1, the prefix of text2, the suffix of
 *     text2 and the common middle.  Or null if there was no match.
 * @private
 */
diff_match_patch.prototype.diff_halfMatch_ = function(text1, text2) {
  if (this.Diff_Timeout <= 0) {
    // Don't risk returning a non-optimal diff if we have unlimited time.
    return null;
  }
  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
    return null;  // Pointless.
  }
  var dmp = this;  // 'this' becomes 'window' in a closure.

  /**
   * Does a substring of shorttext exist within longtext such that the substring
   * is at least half the length of longtext?
   * Closure, but does not reference any external variables.
   * @param {string} longtext Longer string.
   * @param {string} shorttext Shorter string.
   * @param {number} i Start index of quarter length substring within longtext.
   * @return {Array.<string>} Five element Array, containing the prefix of
   *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
   *     of shorttext and the common middle.  Or null if there was no match.
   * @private
   */
  function diff_halfMatchI_(longtext, shorttext, i) {
    // Start with a 1/4 length substring at position i as a seed.
    var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
    var j = -1;
    var best_common = '';
    var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
    while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
      var prefixLength = dmp.diff_commonPrefix(longtext.substring(i),
                                               shorttext.substring(j));
      var suffixLength = dmp.diff_commonSuffix(longtext.substring(0, i),
                                               shorttext.substring(0, j));
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
    } else {
      return null;
    }
  }

  // First check if the second quarter is the seed for a half-match.
  var hm1 = diff_halfMatchI_(longtext, shorttext,
                             Math.ceil(longtext.length / 4));
  // Check again based on the third quarter.
  var hm2 = diff_halfMatchI_(longtext, shorttext,
                             Math.ceil(longtext.length / 2));
  var hm;
  if (!hm1 && !hm2) {
    return null;
  } else if (!hm2) {
    hm = hm1;
  } else if (!hm1) {
    hm = hm2;
  } else {
    // Both matched.  Select the longest.
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  }

  // A half-match was found, sort out the return data.
  var text1_a, text1_b, text2_a, text2_b;
  if (text1.length > text2.length) {
    text1_a = hm[0];
    text1_b = hm[1];
    text2_a = hm[2];
    text2_b = hm[3];
  } else {
    text2_a = hm[0];
    text2_b = hm[1];
    text1_a = hm[2];
    text1_b = hm[3];
  }
  var mid_common = hm[4];
  return [text1_a, text1_b, text2_a, text2_b, mid_common];
};


/**
 * Reduce the number of edits by eliminating semantically trivial equalities.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemantic = function(diffs) {
  var changes = false;
  var equalities = [];  // Stack of indices where equalities are found.
  var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
  /** @type {?string} */
  var lastequality = null;
  // Always equal to diffs[equalities[equalitiesLength - 1]][1]
  var pointer = 0;  // Index of current position.
  // Number of characters that changed prior to the equality.
  var length_insertions1 = 0;
  var length_deletions1 = 0;
  // Number of characters that changed after the equality.
  var length_insertions2 = 0;
  var length_deletions2 = 0;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] == DIFF_EQUAL) {  // Equality found.
      equalities[equalitiesLength++] = pointer;
      length_insertions1 = length_insertions2;
      length_deletions1 = length_deletions2;
      length_insertions2 = 0;
      length_deletions2 = 0;
      lastequality = diffs[pointer][1];
    } else {  // An insertion or deletion.
      if (diffs[pointer][0] == DIFF_INSERT) {
        length_insertions2 += diffs[pointer][1].length;
      } else {
        length_deletions2 += diffs[pointer][1].length;
      }
      // Eliminate an equality that is smaller or equal to the edits on both
      // sides of it.
      if (lastequality && (lastequality.length <=
          Math.max(length_insertions1, length_deletions1)) &&
          (lastequality.length <= Math.max(length_insertions2,
                                           length_deletions2))) {
        // Duplicate record.
        diffs.splice(equalities[equalitiesLength - 1], 0,
                     [DIFF_DELETE, lastequality]);
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        // Throw away the equality we just deleted.
        equalitiesLength--;
        // Throw away the previous equality (it needs to be reevaluated).
        equalitiesLength--;
        pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
        length_insertions1 = 0;  // Reset the counters.
        length_deletions1 = 0;
        length_insertions2 = 0;
        length_deletions2 = 0;
        lastequality = null;
        changes = true;
      }
    }
    pointer++;
  }

  // Normalize the diff.
  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
  this.diff_cleanupSemanticLossless(diffs);

  // Find any overlaps between deletions and insertions.
  // e.g: <del>abcxxx</del><ins>xxxdef</ins>
  //   -> <del>abc</del>xxx<ins>def</ins>
  // e.g: <del>xxxabc</del><ins>defxxx</ins>
  //   -> <ins>def</ins>xxx<del>abc</del>
  // Only extract an overlap if it is as big as the edit ahead or behind it.
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
          // Overlap found.  Insert an equality and trim the surrounding edits.
          diffs.splice(pointer, 0,
              [DIFF_EQUAL, insertion.substring(0, overlap_length1)]);
          diffs[pointer - 1][1] =
              deletion.substring(0, deletion.length - overlap_length1);
          diffs[pointer + 1][1] = insertion.substring(overlap_length1);
          pointer++;
        }
      } else {
        if (overlap_length2 >= deletion.length / 2 ||
            overlap_length2 >= insertion.length / 2) {
          // Reverse overlap found.
          // Insert an equality and swap and trim the surrounding edits.
          diffs.splice(pointer, 0,
              [DIFF_EQUAL, deletion.substring(0, overlap_length2)]);
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


/**
 * Look for single edits surrounded on both sides by equalities
 * which can be shifted sideways to align the edit to a word boundary.
 * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemanticLossless = function(diffs) {
  /**
   * Given two strings, compute a score representing whether the internal
   * boundary falls on logical boundaries.
   * Scores range from 6 (best) to 0 (worst).
   * Closure, but does not reference any external variables.
   * @param {string} one First string.
   * @param {string} two Second string.
   * @return {number} The score.
   * @private
   */
  function diff_cleanupSemanticScore_(one, two) {
    if (!one || !two) {
      // Edges are the best.
      return 6;
    }

    // Each port of this function behaves slightly differently due to
    // subtle differences in each language's definition of things like
    // 'whitespace'.  Since this function's purpose is largely cosmetic,
    // the choice has been made to use each language's native features
    // rather than force total conformity.
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
      // Five points for blank lines.
      return 5;
    } else if (lineBreak1 || lineBreak2) {
      // Four points for line breaks.
      return 4;
    } else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
      // Three points for end of sentences.
      return 3;
    } else if (whitespace1 || whitespace2) {
      // Two points for whitespace.
      return 2;
    } else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
      // One point for non-alphanumeric.
      return 1;
    }
    return 0;
  }

  var pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
        diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      var equality1 = diffs[pointer - 1][1];
      var edit = diffs[pointer][1];
      var equality2 = diffs[pointer + 1][1];

      // First, shift the edit as far left as possible.
      var commonOffset = this.diff_commonSuffix(equality1, edit);
      if (commonOffset) {
        var commonString = edit.substring(edit.length - commonOffset);
        equality1 = equality1.substring(0, equality1.length - commonOffset);
        edit = commonString + edit.substring(0, edit.length - commonOffset);
        equality2 = commonString + equality2;
      }

      // Second, step character by character right, looking for the best fit.
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
        // The >= encourages trailing rather than leading whitespace on edits.
        if (score >= bestScore) {
          bestScore = score;
          bestEquality1 = equality1;
          bestEdit = edit;
          bestEquality2 = equality2;
        }
      }

      if (diffs[pointer - 1][1] != bestEquality1) {
        // We have an improvement, save it back to the diff.
        if (bestEquality1) {
          diffs[pointer - 1][1] = bestEquality1;
        } else {
          diffs.splice(pointer - 1, 1);
          pointer--;
        }
        diffs[pointer][1] = bestEdit;
        if (bestEquality2) {
          diffs[pointer + 1][1] = bestEquality2;
        } else {
          diffs.splice(pointer + 1, 1);
          pointer--;
        }
      }
    }
    pointer++;
  }
};

// Define some regex patterns for matching boundaries.
diff_match_patch.nonAlphaNumericRegex_ = /[^a-zA-Z0-9]/;
diff_match_patch.whitespaceRegex_ = /\s/;
diff_match_patch.linebreakRegex_ = /[\r\n]/;
diff_match_patch.blanklineEndRegex_ = /\n\r?\n$/;
diff_match_patch.blanklineStartRegex_ = /^\r?\n\r?\n/;

/**
 * Reduce the number of edits by eliminating operationally trivial equalities.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupEfficiency = function(diffs) {
  var changes = false;
  var equalities = [];  // Stack of indices where equalities are found.
  var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
  /** @type {?string} */
  var lastequality = null;
  // Always equal to diffs[equalities[equalitiesLength - 1]][1]
  var pointer = 0;  // Index of current position.
  // Is there an insertion operation before the last equality.
  var pre_ins = false;
  // Is there a deletion operation before the last equality.
  var pre_del = false;
  // Is there an insertion operation after the last equality.
  var post_ins = false;
  // Is there a deletion operation after the last equality.
  var post_del = false;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] == DIFF_EQUAL) {  // Equality found.
      if (diffs[pointer][1].length < this.Diff_EditCost &&
          (post_ins || post_del)) {
        // Candidate found.
        equalities[equalitiesLength++] = pointer;
        pre_ins = post_ins;
        pre_del = post_del;
        lastequality = diffs[pointer][1];
      } else {
        // Not a candidate, and can never become one.
        equalitiesLength = 0;
        lastequality = null;
      }
      post_ins = post_del = false;
    } else {  // An insertion or deletion.
      if (diffs[pointer][0] == DIFF_DELETE) {
        post_del = true;
      } else {
        post_ins = true;
      }
      /*
       * Five types to be split:
       * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
       * <ins>A</ins>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<ins>C</ins>
       * <ins>A</del>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<del>C</del>
       */
      if (lastequality && ((pre_ins && pre_del && post_ins && post_del) ||
                           ((lastequality.length < this.Diff_EditCost / 2) &&
                            (pre_ins + pre_del + post_ins + post_del) == 3))) {
        // Duplicate record.
        diffs.splice(equalities[equalitiesLength - 1], 0,
                     [DIFF_DELETE, lastequality]);
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        equalitiesLength--;  // Throw away the equality we just deleted;
        lastequality = null;
        if (pre_ins && pre_del) {
          // No changes made which could affect previous entry, keep going.
          post_ins = post_del = true;
          equalitiesLength = 0;
        } else {
          equalitiesLength--;  // Throw away the previous equality.
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


/**
 * Reorder and merge like edit sections.  Merge equalities.
 * Any edit section can move as long as it doesn't cross an equality.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupMerge = function(diffs) {
  diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
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
        // Upon reaching an equality, check for prior redundancies.
        if (count_delete + count_insert > 1) {
          if (count_delete !== 0 && count_insert !== 0) {
            // Factor out any common prefixies.
            commonlength = this.diff_commonPrefix(text_insert, text_delete);
            if (commonlength !== 0) {
              if ((pointer - count_delete - count_insert) > 0 &&
                  diffs[pointer - count_delete - count_insert - 1][0] ==
                  DIFF_EQUAL) {
                diffs[pointer - count_delete - count_insert - 1][1] +=
                    text_insert.substring(0, commonlength);
              } else {
                diffs.splice(0, 0, [DIFF_EQUAL,
                                    text_insert.substring(0, commonlength)]);
                pointer++;
              }
              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            }
            // Factor out any common suffixies.
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
          // Delete the offending records and add the merged ones.
          if (count_delete === 0) {
            diffs.splice(pointer - count_insert,
                count_delete + count_insert, [DIFF_INSERT, text_insert]);
          } else if (count_insert === 0) {
            diffs.splice(pointer - count_delete,
                count_delete + count_insert, [DIFF_DELETE, text_delete]);
          } else {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_DELETE, text_delete],
                [DIFF_INSERT, text_insert]);
          }
          pointer = pointer - count_delete - count_insert +
                    (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
        } else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
          // Merge this equality with the previous one.
          diffs[pointer - 1][1] += diffs[pointer][1];
          diffs.splice(pointer, 1);
        } else {
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
    diffs.pop();  // Remove the dummy entry at the end.
  }

  // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  var changes = false;
  pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
        diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      if (diffs[pointer][1].substring(diffs[pointer][1].length -
          diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
        // Shift the edit over the previous equality.
        diffs[pointer][1] = diffs[pointer - 1][1] +
            diffs[pointer][1].substring(0, diffs[pointer][1].length -
                                        diffs[pointer - 1][1].length);
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
          diffs[pointer + 1][1]) {
        // Shift the edit over the next equality.
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
  // If shifts were made, the diff needs reordering and another shift sweep.
  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
};


/**
 * loc is a location in text1, compute and return the equivalent location in
 * text2.
 * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @param {number} loc Location within text1.
 * @return {number} Location within text2.
 */
diff_match_patch.prototype.diff_xIndex = function(diffs, loc) {
  var chars1 = 0;
  var chars2 = 0;
  var last_chars1 = 0;
  var last_chars2 = 0;
  var x;
  for (x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT) {  // Equality or deletion.
      chars1 += diffs[x][1].length;
    }
    if (diffs[x][0] !== DIFF_DELETE) {  // Equality or insertion.
      chars2 += diffs[x][1].length;
    }
    if (chars1 > loc) {  // Overshot the location.
      break;
    }
    last_chars1 = chars1;
    last_chars2 = chars2;
  }
  // Was the location was deleted?
  if (diffs.length != x && diffs[x][0] === DIFF_DELETE) {
    return last_chars2;
  }
  // Add the remaining character length.
  return last_chars2 + (loc - last_chars1);
};


/**
 * Convert a diff array into a pretty HTML report.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} HTML representation.
 */
diff_match_patch.prototype.diff_prettyHtml = function(diffs) {
  var html = [];
  var pattern_amp = /&/g;
  var pattern_lt = /</g;
  var pattern_gt = />/g;
  var pattern_para = /\n/g;
  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];    // Operation (insert, delete, equal)
    var data = diffs[x][1];  // Text of change.
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


/**
 * Compute and return the source text (all equalities and deletions).
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Source text.
 */
diff_match_patch.prototype.diff_text1 = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT) {
      text[x] = diffs[x][1];
    }
  }
  return text.join('');
};


/**
 * Compute and return the destination text (all equalities and insertions).
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Destination text.
 */
diff_match_patch.prototype.diff_text2 = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_DELETE) {
      text[x] = diffs[x][1];
    }
  }
  return text.join('');
};


/**
 * Compute the Levenshtein distance; the number of inserted, deleted or
 * substituted characters.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {number} Number of changes.
 */
diff_match_patch.prototype.diff_levenshtein = function(diffs) {
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
        // A deletion and an insertion is one substitution.
        levenshtein += Math.max(insertions, deletions);
        insertions = 0;
        deletions = 0;
        break;
    }
  }
  levenshtein += Math.max(insertions, deletions);
  return levenshtein;
};


/**
 * Crush the diff into an encoded string which describes the operations
 * required to transform text1 into text2.
 * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
 * Operations are tab-separated.  Inserted text is escaped using %xx notation.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Delta text.
 */
diff_match_patch.prototype.diff_toDelta = function(diffs) {
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


/**
 * Given the original text1, and an encoded string which describes the
 * operations required to transform text1 into text2, compute the full diff.
 * @param {string} text1 Source string for the diff.
 * @param {string} delta Delta text.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @throws {!Error} If invalid input.
 */
diff_match_patch.prototype.diff_fromDelta = function(text1, delta) {
  var diffs = [];
  var diffsLength = 0;  // Keeping our own length var is faster in JS.
  var pointer = 0;  // Cursor in text1
  var tokens = delta.split(/\t/g);
  for (var x = 0; x < tokens.length; x++) {
    // Each token begins with a one character parameter which specifies the
    // operation of this token (delete, insert, equality).
    var param = tokens[x].substring(1);
    switch (tokens[x].charAt(0)) {
      case '+':
        try {
          diffs[diffsLength++] = [DIFF_INSERT, decodeURI(param)];
        } catch (ex) {
          // Malformed URI sequence.
          throw new Error('Illegal escape in diff_fromDelta: ' + param);
        }
        break;
      case '-':
        // Fall through.
      case '=':
        var n = parseInt(param, 10);
        if (isNaN(n) || n < 0) {
          throw new Error('Invalid number in diff_fromDelta: ' + param);
        }
        var text = text1.substring(pointer, pointer += n);
        if (tokens[x].charAt(0) == '=') {
          diffs[diffsLength++] = [DIFF_EQUAL, text];
        } else {
          diffs[diffsLength++] = [DIFF_DELETE, text];
        }
        break;
      default:
        // Blank tokens are ok (from a trailing \t).
        // Anything else is an error.
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


//  MATCH FUNCTIONS


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc'.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 */
diff_match_patch.prototype.match_main = function(text, pattern, loc) {
  // Check for null inputs.
  if (text == null || pattern == null || loc == null) {
    throw new Error('Null input. (match_main)');
  }

  loc = Math.max(0, Math.min(loc, text.length));
  if (text == pattern) {
    // Shortcut (potentially not guaranteed by the algorithm)
    return 0;
  } else if (!text.length) {
    // Nothing to match.
    return -1;
  } else if (text.substring(loc, loc + pattern.length) == pattern) {
    // Perfect match at the perfect spot!  (Includes case of null pattern)
    return loc;
  } else {
    // Do a fuzzy compare.
    return this.match_bitap_(text, pattern, loc);
  }
};


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc' using the
 * Bitap algorithm.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 * @private
 */
diff_match_patch.prototype.match_bitap_ = function(text, pattern, loc) {
  if (pattern.length > this.Match_MaxBits) {
    throw new Error('Pattern too long for this browser.');
  }

  // Initialise the alphabet.
  var s = this.match_alphabet_(pattern);

  var dmp = this;  // 'this' becomes 'window' in a closure.

  /**
   * Compute and return the score for a match with e errors and x location.
   * Accesses loc and pattern through being a closure.
   * @param {number} e Number of errors in match.
   * @param {number} x Location of match.
   * @return {number} Overall score for match (0.0 = good, 1.0 = bad).
   * @private
   */
  function match_bitapScore_(e, x) {
    var accuracy = e / pattern.length;
    var proximity = Math.abs(loc - x);
    if (!dmp.Match_Distance) {
      // Dodge divide by zero error.
      return proximity ? 1.0 : accuracy;
    }
    return accuracy + (proximity / dmp.Match_Distance);
  }

  // Highest score beyond which we give up.
  var score_threshold = this.Match_Threshold;
  // Is there a nearby exact match? (speedup)
  var best_loc = text.indexOf(pattern, loc);
  if (best_loc != -1) {
    score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
    // What about in the other direction? (speedup)
    best_loc = text.lastIndexOf(pattern, loc + pattern.length);
    if (best_loc != -1) {
      score_threshold =
          Math.min(match_bitapScore_(0, best_loc), score_threshold);
    }
  }

  // Initialise the bit arrays.
  var matchmask = 1 << (pattern.length - 1);
  best_loc = -1;

  var bin_min, bin_mid;
  var bin_max = pattern.length + text.length;
  var last_rd;
  for (var d = 0; d < pattern.length; d++) {
    // Scan for the best match; each iteration allows for one more error.
    // Run a binary search to determine how far from 'loc' we can stray at this
    // error level.
    bin_min = 0;
    bin_mid = bin_max;
    while (bin_min < bin_mid) {
      if (match_bitapScore_(d, loc + bin_mid) <= score_threshold) {
        bin_min = bin_mid;
      } else {
        bin_max = bin_mid;
      }
      bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
    }
    // Use the result from this iteration as the maximum for the next.
    bin_max = bin_mid;
    var start = Math.max(1, loc - bin_mid + 1);
    var finish = Math.min(loc + bin_mid, text.length) + pattern.length;

    var rd = Array(finish + 2);
    rd[finish + 1] = (1 << d) - 1;
    for (var j = finish; j >= start; j--) {
      // The alphabet (s) is a sparse hash, so the following line generates
      // warnings.
      var charMatch = s[text.charAt(j - 1)];
      if (d === 0) {  // First pass: exact match.
        rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
      } else {  // Subsequent passes: fuzzy match.
        rd[j] = (((rd[j + 1] << 1) | 1) & charMatch) |
                (((last_rd[j + 1] | last_rd[j]) << 1) | 1) |
                last_rd[j + 1];
      }
      if (rd[j] & matchmask) {
        var score = match_bitapScore_(d, j - 1);
        // This match will almost certainly be better than any existing match.
        // But check anyway.
        if (score <= score_threshold) {
          // Told you so.
          score_threshold = score;
          best_loc = j - 1;
          if (best_loc > loc) {
            // When passing loc, don't exceed our current distance from loc.
            start = Math.max(1, 2 * loc - best_loc);
          } else {
            // Already passed loc, downhill from here on in.
            break;
          }
        }
      }
    }
    // No hope for a (better) match at greater error levels.
    if (match_bitapScore_(d + 1, loc) > score_threshold) {
      break;
    }
    last_rd = rd;
  }
  return best_loc;
};


/**
 * Initialise the alphabet for the Bitap algorithm.
 * @param {string} pattern The text to encode.
 * @return {!Object} Hash of character locations.
 * @private
 */
diff_match_patch.prototype.match_alphabet_ = function(pattern) {
  var s = {};
  for (var i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] = 0;
  }
  for (var i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
  }
  return s;
};


//  PATCH FUNCTIONS


/**
 * Increase the context until it is unique,
 * but don't let the pattern expand beyond Match_MaxBits.
 * @param {!diff_match_patch.patch_obj} patch The patch to grow.
 * @param {string} text Source text.
 * @private
 */
diff_match_patch.prototype.patch_addContext_ = function(patch, text) {
  if (text.length == 0) {
    return;
  }
  var pattern = text.substring(patch.start2, patch.start2 + patch.length1);
  var padding = 0;

  // Look for the first and last matches of pattern in text.  If two different
  // matches are found, increase the pattern length.
  while (text.indexOf(pattern) != text.lastIndexOf(pattern) &&
         pattern.length < this.Match_MaxBits - this.Patch_Margin -
         this.Patch_Margin) {
    padding += this.Patch_Margin;
    pattern = text.substring(patch.start2 - padding,
                             patch.start2 + patch.length1 + padding);
  }
  // Add one chunk for good luck.
  padding += this.Patch_Margin;

  // Add the prefix.
  var prefix = text.substring(patch.start2 - padding, patch.start2);
  if (prefix) {
    patch.diffs.unshift([DIFF_EQUAL, prefix]);
  }
  // Add the suffix.
  var suffix = text.substring(patch.start2 + patch.length1,
                              patch.start2 + patch.length1 + padding);
  if (suffix) {
    patch.diffs.push([DIFF_EQUAL, suffix]);
  }

  // Roll back the start points.
  patch.start1 -= prefix.length;
  patch.start2 -= prefix.length;
  // Extend the lengths.
  patch.length1 += prefix.length + suffix.length;
  patch.length2 += prefix.length + suffix.length;
};


/**
 * Compute a list of patches to turn text1 into text2.
 * Use diffs if provided, otherwise compute it ourselves.
 * There are four ways to call this function, depending on what data is
 * available to the caller:
 * Method 1:
 * a = text1, b = text2
 * Method 2:
 * a = diffs
 * Method 3 (optimal):
 * a = text1, b = diffs
 * Method 4 (deprecated, use method 3):
 * a = text1, b = text2, c = diffs
 *
 * @param {string|!Array.<!diff_match_patch.Diff>} a text1 (methods 1,3,4) or
 * Array of diff tuples for text1 to text2 (method 2).
 * @param {string|!Array.<!diff_match_patch.Diff>} opt_b text2 (methods 1,4) or
 * Array of diff tuples for text1 to text2 (method 3) or undefined (method 2).
 * @param {string|!Array.<!diff_match_patch.Diff>} opt_c Array of diff tuples
 * for text1 to text2 (method 4) or undefined (methods 1,2,3).
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of Patch objects.
 */
diff_match_patch.prototype.patch_make = function(a, opt_b, opt_c) {
  var text1, diffs;
  if (typeof a == 'string' && typeof opt_b == 'string' &&
      typeof opt_c == 'undefined') {
    // Method 1: text1, text2
    // Compute diffs from text1 and text2.
    text1 = /** @type {string} */(a);
    diffs = this.diff_main(text1, /** @type {string} */(opt_b), true);
    if (diffs.length > 2) {
      this.diff_cleanupSemantic(diffs);
      this.diff_cleanupEfficiency(diffs);
    }
  } else if (a && typeof a == 'object' && typeof opt_b == 'undefined' &&
      typeof opt_c == 'undefined') {
    // Method 2: diffs
    // Compute text1 from diffs.
    diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(a);
    text1 = this.diff_text1(diffs);
  } else if (typeof a == 'string' && opt_b && typeof opt_b == 'object' &&
      typeof opt_c == 'undefined') {
    // Method 3: text1, diffs
    text1 = /** @type {string} */(a);
    diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(opt_b);
  } else if (typeof a == 'string' && typeof opt_b == 'string' &&
      opt_c && typeof opt_c == 'object') {
    // Method 4: text1, text2, diffs
    // text2 is not used.
    text1 = /** @type {string} */(a);
    diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(opt_c);
  } else {
    throw new Error('Unknown call format to patch_make.');
  }

  if (diffs.length === 0) {
    return [];  // Get rid of the null case.
  }
  var patches = [];
  var patch = new diff_match_patch.patch_obj();
  var patchDiffLength = 0;  // Keeping our own length var is faster in JS.
  var char_count1 = 0;  // Number of characters into the text1 string.
  var char_count2 = 0;  // Number of characters into the text2 string.
  // Start with text1 (prepatch_text) and apply the diffs until we arrive at
  // text2 (postpatch_text).  We recreate the patches one by one to determine
  // context info.
  var prepatch_text = text1;
  var postpatch_text = text1;
  for (var x = 0; x < diffs.length; x++) {
    var diff_type = diffs[x][0];
    var diff_text = diffs[x][1];

    if (!patchDiffLength && diff_type !== DIFF_EQUAL) {
      // A new patch starts here.
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
          // Small equality inside a patch.
          patch.diffs[patchDiffLength++] = diffs[x];
          patch.length1 += diff_text.length;
          patch.length2 += diff_text.length;
        } else if (diff_text.length >= 2 * this.Patch_Margin) {
          // Time for a new patch.
          if (patchDiffLength) {
            this.patch_addContext_(patch, prepatch_text);
            patches.push(patch);
            patch = new diff_match_patch.patch_obj();
            patchDiffLength = 0;
            // Unlike Unidiff, our patch lists have a rolling context.
            // http://code.google.com/p/google-diff-match-patch/wiki/Unidiff
            // Update prepatch text & pos to reflect the application of the
            // just completed patch.
            prepatch_text = postpatch_text;
            char_count1 = char_count2;
          }
        }
        break;
    }

    // Update the current character count.
    if (diff_type !== DIFF_INSERT) {
      char_count1 += diff_text.length;
    }
    if (diff_type !== DIFF_DELETE) {
      char_count2 += diff_text.length;
    }
  }
  // Pick up the leftover patch if not empty.
  if (patchDiffLength) {
    this.patch_addContext_(patch, prepatch_text);
    patches.push(patch);
  }

  return patches;
};


/**
 * Given an array of patches, return another array that is identical.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of Patch objects.
 */
diff_match_patch.prototype.patch_deepCopy = function(patches) {
  // Making deep copies is hard in JavaScript.
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


/**
 * Merge a set of patches onto the text.  Return a patched text, as well
 * as a list of true/false values indicating which patches were applied.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @param {string} text Old text.
 * @return {!Array.<string|!Array.<boolean>>} Two element Array, containing the
 *      new text and an array of boolean values.
 */
diff_match_patch.prototype.patch_apply = function(patches, text) {
  if (patches.length == 0) {
    return [text, []];
  }

  // Deep copy the patches so that no changes are made to originals.
  patches = this.patch_deepCopy(patches);

  var nullPadding = this.patch_addPadding(patches);
  text = nullPadding + text + nullPadding;

  this.patch_splitMax(patches);
  // delta keeps track of the offset between the expected and actual location
  // of the previous patch.  If there are patches expected at positions 10 and
  // 20, but the first patch was found at 12, delta is 2 and the second patch
  // has an effective expected position of 22.
  var delta = 0;
  var results = [];
  for (var x = 0; x < patches.length; x++) {
    var expected_loc = patches[x].start2 + delta;
    var text1 = this.diff_text1(patches[x].diffs);
    var start_loc;
    var end_loc = -1;
    if (text1.length > this.Match_MaxBits) {
      // patch_splitMax will only provide an oversized pattern in the case of
      // a monster delete.
      start_loc = this.match_main(text, text1.substring(0, this.Match_MaxBits),
                                  expected_loc);
      if (start_loc != -1) {
        end_loc = this.match_main(text,
            text1.substring(text1.length - this.Match_MaxBits),
            expected_loc + text1.length - this.Match_MaxBits);
        if (end_loc == -1 || start_loc >= end_loc) {
          // Can't find valid trailing context.  Drop this patch.
          start_loc = -1;
        }
      }
    } else {
      start_loc = this.match_main(text, text1, expected_loc);
    }
    if (start_loc == -1) {
      // No match found.  :(
      results[x] = false;
      // Subtract the delta for this failed patch from subsequent patches.
      delta -= patches[x].length2 - patches[x].length1;
    } else {
      // Found a match.  :)
      results[x] = true;
      delta = start_loc - expected_loc;
      var text2;
      if (end_loc == -1) {
        text2 = text.substring(start_loc, start_loc + text1.length);
      } else {
        text2 = text.substring(start_loc, end_loc + this.Match_MaxBits);
      }
      if (text1 == text2) {
        // Perfect match, just shove the replacement text in.
        text = text.substring(0, start_loc) +
               this.diff_text2(patches[x].diffs) +
               text.substring(start_loc + text1.length);
      } else {
        // Imperfect match.  Run a diff to get a framework of equivalent
        // indices.
        var diffs = this.diff_main(text1, text2, false);
        if (text1.length > this.Match_MaxBits &&
            this.diff_levenshtein(diffs) / text1.length >
            this.Patch_DeleteThreshold) {
          // The end points match, but the content is unacceptably bad.
          results[x] = false;
        } else {
          this.diff_cleanupSemanticLossless(diffs);
          var index1 = 0;
          var index2;
          for (var y = 0; y < patches[x].diffs.length; y++) {
            var mod = patches[x].diffs[y];
            if (mod[0] !== DIFF_EQUAL) {
              index2 = this.diff_xIndex(diffs, index1);
            }
            if (mod[0] === DIFF_INSERT) {  // Insertion
              text = text.substring(0, start_loc + index2) + mod[1] +
                     text.substring(start_loc + index2);
            } else if (mod[0] === DIFF_DELETE) {  // Deletion
              text = text.substring(0, start_loc + index2) +
                     text.substring(start_loc + this.diff_xIndex(diffs,
                         index1 + mod[1].length));
            }
            if (mod[0] !== DIFF_DELETE) {
              index1 += mod[1].length;
            }
          }
        }
      }
    }
  }
  // Strip the padding off.
  text = text.substring(nullPadding.length, text.length - nullPadding.length);
  return [text, results];
};


/**
 * Add some padding on text start and end so that edges can match something.
 * Intended to be called only from within patch_apply.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @return {string} The padding string added to each side.
 */
diff_match_patch.prototype.patch_addPadding = function(patches) {
  var paddingLength = this.Patch_Margin;
  var nullPadding = '';
  for (var x = 1; x <= paddingLength; x++) {
    nullPadding += String.fromCharCode(x);
  }

  // Bump all the patches forward.
  for (var x = 0; x < patches.length; x++) {
    patches[x].start1 += paddingLength;
    patches[x].start2 += paddingLength;
  }

  // Add some padding on start of first diff.
  var patch = patches[0];
  var diffs = patch.diffs;
  if (diffs.length == 0 || diffs[0][0] != DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.unshift([DIFF_EQUAL, nullPadding]);
    patch.start1 -= paddingLength;  // Should be 0.
    patch.start2 -= paddingLength;  // Should be 0.
    patch.length1 += paddingLength;
    patch.length2 += paddingLength;
  } else if (paddingLength > diffs[0][1].length) {
    // Grow first equality.
    var extraLength = paddingLength - diffs[0][1].length;
    diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1];
    patch.start1 -= extraLength;
    patch.start2 -= extraLength;
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }

  // Add some padding on end of last diff.
  patch = patches[patches.length - 1];
  diffs = patch.diffs;
  if (diffs.length == 0 || diffs[diffs.length - 1][0] != DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.push([DIFF_EQUAL, nullPadding]);
    patch.length1 += paddingLength;
    patch.length2 += paddingLength;
  } else if (paddingLength > diffs[diffs.length - 1][1].length) {
    // Grow last equality.
    var extraLength = paddingLength - diffs[diffs.length - 1][1].length;
    diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }

  return nullPadding;
};


/**
 * Look through the patches and break up any which are longer than the maximum
 * limit of the match algorithm.
 * Intended to be called only from within patch_apply.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 */
diff_match_patch.prototype.patch_splitMax = function(patches) {
  var patch_size = this.Match_MaxBits;
  for (var x = 0; x < patches.length; x++) {
    if (patches[x].length1 <= patch_size) {
      continue;
    }
    var bigpatch = patches[x];
    // Remove the big old patch.
    patches.splice(x--, 1);
    var start1 = bigpatch.start1;
    var start2 = bigpatch.start2;
    var precontext = '';
    while (bigpatch.diffs.length !== 0) {
      // Create one of several smaller patches.
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
          // Insertions are harmless.
          patch.length2 += diff_text.length;
          start2 += diff_text.length;
          patch.diffs.push(bigpatch.diffs.shift());
          empty = false;
        } else if (diff_type === DIFF_DELETE && patch.diffs.length == 1 &&
                   patch.diffs[0][0] == DIFF_EQUAL &&
                   diff_text.length > 2 * patch_size) {
          // This is a large deletion.  Let it pass in one chunk.
          patch.length1 += diff_text.length;
          start1 += diff_text.length;
          empty = false;
          patch.diffs.push([diff_type, diff_text]);
          bigpatch.diffs.shift();
        } else {
          // Deletion or equality.  Only take as much as we can stomach.
          diff_text = diff_text.substring(0,
              patch_size - patch.length1 - this.Patch_Margin);
          patch.length1 += diff_text.length;
          start1 += diff_text.length;
          if (diff_type === DIFF_EQUAL) {
            patch.length2 += diff_text.length;
            start2 += diff_text.length;
          } else {
            empty = false;
          }
          patch.diffs.push([diff_type, diff_text]);
          if (diff_text == bigpatch.diffs[0][1]) {
            bigpatch.diffs.shift();
          } else {
            bigpatch.diffs[0][1] =
                bigpatch.diffs[0][1].substring(diff_text.length);
          }
        }
      }
      // Compute the head context for the next patch.
      precontext = this.diff_text2(patch.diffs);
      precontext =
          precontext.substring(precontext.length - this.Patch_Margin);
      // Append the end context for this patch.
      var postcontext = this.diff_text1(bigpatch.diffs)
                            .substring(0, this.Patch_Margin);
      if (postcontext !== '') {
        patch.length1 += postcontext.length;
        patch.length2 += postcontext.length;
        if (patch.diffs.length !== 0 &&
            patch.diffs[patch.diffs.length - 1][0] === DIFF_EQUAL) {
          patch.diffs[patch.diffs.length - 1][1] += postcontext;
        } else {
          patch.diffs.push([DIFF_EQUAL, postcontext]);
        }
      }
      if (!empty) {
        patches.splice(++x, 0, patch);
      }
    }
  }
};


/**
 * Take a list of patches and return a textual representation.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @return {string} Text representation of patches.
 */
diff_match_patch.prototype.patch_toText = function(patches) {
  var text = [];
  for (var x = 0; x < patches.length; x++) {
    text[x] = patches[x];
  }
  return text.join('');
};


/**
 * Parse a textual representation of patches and return a list of Patch objects.
 * @param {string} textline Text representation of patches.
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of Patch objects.
 * @throws {!Error} If invalid input.
 */
diff_match_patch.prototype.patch_fromText = function(textline) {
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
    } else if (m[2] == '0') {
      patch.length1 = 0;
    } else {
      patch.start1--;
      patch.length1 = parseInt(m[2], 10);
    }

    patch.start2 = parseInt(m[3], 10);
    if (m[4] === '') {
      patch.start2--;
      patch.length2 = 1;
    } else if (m[4] == '0') {
      patch.length2 = 0;
    } else {
      patch.start2--;
      patch.length2 = parseInt(m[4], 10);
    }
    textPointer++;

    while (textPointer < text.length) {
      var sign = text[textPointer].charAt(0);
      try {
        var line = decodeURI(text[textPointer].substring(1));
      } catch (ex) {
        // Malformed URI sequence.
        throw new Error('Illegal escape in patch_fromText: ' + line);
      }
      if (sign == '-') {
        // Deletion.
        patch.diffs.push([DIFF_DELETE, line]);
      } else if (sign == '+') {
        // Insertion.
        patch.diffs.push([DIFF_INSERT, line]);
      } else if (sign == ' ') {
        // Minor equality.
        patch.diffs.push([DIFF_EQUAL, line]);
      } else if (sign == '@') {
        // Start of next patch.
        break;
      } else if (sign === '') {
        // Blank line?  Whatever.
      } else {
        // WTF?
        throw new Error('Invalid patch mode "' + sign + '" in: ' + line);
      }
      textPointer++;
    }
  }
  return patches;
};


/**
 * Class representing one patch operation.
 * @constructor
 */
diff_match_patch.patch_obj = function() {
  /** @type {!Array.<!diff_match_patch.Diff>} */
  this.diffs = [];
  /** @type {?number} */
  this.start1 = null;
  /** @type {?number} */
  this.start2 = null;
  /** @type {number} */
  this.length1 = 0;
  /** @type {number} */
  this.length2 = 0;
};


/**
 * Emmulate GNU diff's format.
 * Header: @@ -382,8 +481,9 @@
 * Indicies are printed as 1-based, not 0-based.
 * @return {string} The GNU diff string.
 */
diff_match_patch.patch_obj.prototype.toString = function() {
  var coords1, coords2;
  if (this.length1 === 0) {
    coords1 = this.start1 + ',0';
  } else if (this.length1 == 1) {
    coords1 = this.start1 + 1;
  } else {
    coords1 = (this.start1 + 1) + ',' + this.length1;
  }
  if (this.length2 === 0) {
    coords2 = this.start2 + ',0';
  } else if (this.length2 == 1) {
    coords2 = this.start2 + 1;
  } else {
    coords2 = (this.start2 + 1) + ',' + this.length2;
  }
  var text = ['@@ -' + coords1 + ' +' + coords2 + ' @@\n'];
  var op;
  // Escape the body of the patch with %xx notation.
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


// The following export code was added by @ForbesLindesay
module.exports = diff_match_patch;
module.exports['diff_match_patch'] = diff_match_patch;
module.exports['DIFF_DELETE'] = DIFF_DELETE;
module.exports['DIFF_INSERT'] = DIFF_INSERT;
module.exports['DIFF_EQUAL'] = DIFF_EQUAL;

},{}],2:[function(require,module,exports){
"use strict";
var windowWithLibs = window;
var originalAcrolinxLibs = windowWithLibs['acrolinxLibs'] || {};
exports.Q = originalAcrolinxLibs.Q || windowWithLibs['Q'];
exports._ = originalAcrolinxLibs._ || windowWithLibs['_'];

},{}],3:[function(require,module,exports){
"use strict";
var acrolinx_libs_defaults_1 = require('./acrolinx-libs/acrolinx-libs-defaults');
var sidebar_loader_1 = require("./utils/sidebar-loader");
var floating_sidebar_1 = require("./floating-sidebar/floating-sidebar");
var AutoBindAdapter_1 = require("./adapters/AutoBindAdapter");
var AdapterInterface_1 = require("./adapters/AdapterInterface");
var message_adapter_1 = require("./message-adapter/message-adapter");
var utils_1 = require("./utils/utils");
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
            acrolinxSidebar.init(acrolinx_libs_defaults_1._.assign({}, {
                showServerSelector: true,
                clientComponents: clientComponents
            }, config));
        }
        function getDefaultDocumentReference() {
            if (config.getDocumentReference) {
                return config.getDocumentReference();
            }
            else {
                return window.location.href;
            }
        }
        function requestGlobalCheckSync(extractionResult, format) {
            if (format === void 0) { format = 'HTML'; }
            if (AdapterInterface_1.hasError(extractionResult)) {
                window.alert(extractionResult.error);
            }
            else {
                var checkInfo = acrolinxSidebar.checkGlobal(extractionResult.content, {
                    inputFormat: format || 'HTML',
                    requestDescription: {
                        documentReference: extractionResult.documentReference || getDefaultDocumentReference()
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
                var contentExtractionResultOrPromise = adapter.extractContentForCheck();
                var pFormat = adapter.getFormat ? adapter.getFormat() : undefined;
                if (isPromise(contentExtractionResultOrPromise)) {
                    contentExtractionResultOrPromise.then(function (contentExtractionResult) {
                        requestGlobalCheckSync(contentExtractionResult, pFormat);
                    });
                }
                else {
                    requestGlobalCheckSync(contentExtractionResultOrPromise, pFormat);
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
            message_adapter_1.connectAcrolinxPluginToMessages(acrolinxSidebarPlugin, sidebarIFrameElement);
        }
        else {
            sidebarContentWindow.acrolinxPlugin = acrolinxSidebarPlugin;
        }
    }
    sidebar_loader_1.loadSidebarIntoIFrame(config, sidebarIFrameElement, onSidebarLoaded);
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
exports.AcrolinxPlugin = AcrolinxPlugin;
function autoBindFloatingSidebar(basicConf) {
    var conf = utils_1.assign(basicConf, {
        sidebarContainerId: floating_sidebar_1.SIDEBAR_CONTAINER_ID
    });
    var floatingSidebar = floating_sidebar_1.initFloatingSidebar();
    var acrolinxPlugin = new AcrolinxPlugin(conf);
    acrolinxPlugin.registerAdapter(new AutoBindAdapter_1.AutoBindAdapter(conf));
    acrolinxPlugin.init();
    return floatingSidebar;
}
exports.autoBindFloatingSidebar = autoBindFloatingSidebar;

},{"./acrolinx-libs/acrolinx-libs-defaults":2,"./adapters/AdapterInterface":6,"./adapters/AutoBindAdapter":7,"./floating-sidebar/floating-sidebar":15,"./message-adapter/message-adapter":17,"./utils/sidebar-loader":23,"./utils/utils":26}],4:[function(require,module,exports){
"use strict";
var acrolinx_plugin_1 = require("./acrolinx-plugin");
var InputAdapter_1 = require("./adapters/InputAdapter");
var ContentEditableAdapter_1 = require("./adapters/ContentEditableAdapter");
var AbstractRichtextEditorAdapter_1 = require("./adapters/AbstractRichtextEditorAdapter");
var CKEditorAdapter_1 = require("./adapters/CKEditorAdapter");
var TinyMCEAdapter_1 = require("./adapters/TinyMCEAdapter");
var TinyMCEWordpressAdapter_1 = require("./adapters/TinyMCEWordpressAdapter");
var AutoBindAdapter_1 = require("./adapters/AutoBindAdapter");
var MultiEditorAdapter_1 = require("./adapters/MultiEditorAdapter");
var message_adapter_1 = require("./message-adapter/message-adapter");
var sidebar_loader_1 = require("./utils/sidebar-loader");
window.acrolinx = window.acrolinx || {};
window.acrolinx.plugins = {
    AcrolinxPlugin: acrolinx_plugin_1.AcrolinxPlugin,
    autoBindFloatingSidebar: acrolinx_plugin_1.autoBindFloatingSidebar,
    createPluginMessageAdapter: message_adapter_1.createPluginMessageAdapter,
    loadSidebarCode: sidebar_loader_1.loadSidebarCode,
    adapter: {
        AbstractRichtextEditorAdapter: AbstractRichtextEditorAdapter_1.AbstractRichtextEditorAdapter,
        AutoBindAdapter: AutoBindAdapter_1.AutoBindAdapter,
        CKEditorAdapter: CKEditorAdapter_1.CKEditorAdapter,
        ContentEditableAdapter: ContentEditableAdapter_1.ContentEditableAdapter,
        InputAdapter: InputAdapter_1.InputAdapter,
        MultiEditorAdapter: MultiEditorAdapter_1.MultiEditorAdapter,
        TinyMCEAdapter: TinyMCEAdapter_1.TinyMCEAdapter,
        TinyMCEWordpressAdapter: TinyMCEWordpressAdapter_1.TinyMCEWordpressAdapter,
    }
};

},{"./acrolinx-plugin":3,"./adapters/AbstractRichtextEditorAdapter":5,"./adapters/AutoBindAdapter":7,"./adapters/CKEditorAdapter":8,"./adapters/ContentEditableAdapter":9,"./adapters/InputAdapter":10,"./adapters/MultiEditorAdapter":11,"./adapters/TinyMCEAdapter":12,"./adapters/TinyMCEWordpressAdapter":13,"./message-adapter/message-adapter":17,"./utils/sidebar-loader":23}],5:[function(require,module,exports){
"use strict";
var acrolinx_libs_defaults_1 = require("../acrolinx-libs/acrolinx-libs-defaults");
var text_dom_mapping_1 = require("../utils/text-dom-mapping");
var diff_based_1 = require("../lookup/diff-based");
var match_1 = require("../utils/match");
var utils_1 = require("../utils/utils");
var AbstractRichtextEditorAdapter = (function () {
    function AbstractRichtextEditorAdapter(conf) {
        this.config = conf;
    }
    AbstractRichtextEditorAdapter.prototype.getEditorElement = function () {
        return this.getEditorDocument().querySelector('body');
    };
    AbstractRichtextEditorAdapter.prototype.registerCheckCall = function (_checkInfo) {
    };
    AbstractRichtextEditorAdapter.prototype.registerCheckResult = function (_checkResult) {
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
    AbstractRichtextEditorAdapter.prototype.selectMatches = function (_checkId, matches) {
        var textMapping = this.getTextDomMapping();
        var alignedMatches = diff_based_1.lookupMatches(this.currentHtmlChecking, textMapping.text, matches);
        if (acrolinx_libs_defaults_1._.isEmpty(alignedMatches)) {
            throw new Error('Selected flagged content is modified.');
        }
        this.selectAlignedMatches(alignedMatches, textMapping);
        return [alignedMatches, textMapping];
    };
    AbstractRichtextEditorAdapter.prototype.selectAlignedMatches = function (matches, textMapping) {
        var newBegin = matches[0].range[0];
        var matchLength = match_1.getCompleteFlagLength(matches);
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
        var endDomPosition = text_dom_mapping_1.getEndDomPos(begin + length, textMapping.domPositions);
        range.setStart(beginDomPosition.node, beginDomPosition.offset);
        range.setEnd(endDomPosition.node, endDomPosition.offset);
        return range;
    };
    AbstractRichtextEditorAdapter.prototype.replaceAlignedMatches = function (matches) {
        var doc = this.getEditorDocument();
        var reversedMatches = acrolinx_libs_defaults_1._.clone(matches).reverse();
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
        utils_1.fakeInputEvent(this.getEditorElement());
    };
    AbstractRichtextEditorAdapter.prototype.getTextDomMapping = function () {
        return text_dom_mapping_1.extractTextDomMapping(this.getEditorElement());
    };
    return AbstractRichtextEditorAdapter;
}());
exports.AbstractRichtextEditorAdapter = AbstractRichtextEditorAdapter;

},{"../acrolinx-libs/acrolinx-libs-defaults":2,"../lookup/diff-based":16,"../utils/match":21,"../utils/text-dom-mapping":24,"../utils/utils":26}],6:[function(require,module,exports){
"use strict";
function hasError(a) {
    return !!a.error;
}
exports.hasError = hasError;
function hasEditorID(a) {
    return !!a.editorId;
}
exports.hasEditorID = hasEditorID;
function hasElement(a) {
    return !!a.element;
}
exports.hasElement = hasElement;
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
exports.getElementFromAdapterConf = getElementFromAdapterConf;

},{}],7:[function(require,module,exports){
"use strict";
var MultiEditorAdapter_1 = require("./MultiEditorAdapter");
var autobind_1 = require("../autobind/autobind");
var AutoBindAdapter = (function () {
    function AutoBindAdapter(conf) {
        this.conf = conf;
    }
    AutoBindAdapter.prototype.extractContentForCheck = function () {
        var _this = this;
        this.multiAdapter = new MultiEditorAdapter_1.MultiEditorAdapter();
        autobind_1.bindAdaptersForCurrentPage(this.conf).forEach(function (adapter) {
            _this.multiAdapter.addSingleAdapter(adapter);
        });
        return this.multiAdapter.extractContentForCheck();
    };
    AutoBindAdapter.prototype.registerCheckCall = function (_checkInfo) {
    };
    AutoBindAdapter.prototype.registerCheckResult = function (_checkResult) {
    };
    AutoBindAdapter.prototype.selectRanges = function (checkId, matches) {
        this.multiAdapter.selectRanges(checkId, matches);
    };
    AutoBindAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
        this.multiAdapter.replaceRanges(checkId, matchesWithReplacement);
    };
    return AutoBindAdapter;
}());
exports.AutoBindAdapter = AutoBindAdapter;

},{"../autobind/autobind":14,"./MultiEditorAdapter":11}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AbstractRichtextEditorAdapter_1 = require("./AbstractRichtextEditorAdapter");
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
}(AbstractRichtextEditorAdapter_1.AbstractRichtextEditorAdapter));
exports.CKEditorAdapter = CKEditorAdapter;

},{"./AbstractRichtextEditorAdapter":5}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AbstractRichtextEditorAdapter_1 = require("./AbstractRichtextEditorAdapter");
var AdapterInterface_1 = require("./AdapterInterface");
var scrolling_1 = require("../utils/scrolling");
var ContentEditableAdapter = (function (_super) {
    __extends(ContentEditableAdapter, _super);
    function ContentEditableAdapter(conf) {
        _super.call(this, conf);
        this.element = AdapterInterface_1.getElementFromAdapterConf(conf);
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
        scrolling_1.scrollIntoView(el, this.config.scrollOffsetY);
    };
    return ContentEditableAdapter;
}(AbstractRichtextEditorAdapter_1.AbstractRichtextEditorAdapter));
exports.ContentEditableAdapter = ContentEditableAdapter;

},{"../utils/scrolling":22,"./AbstractRichtextEditorAdapter":5,"./AdapterInterface":6}],10:[function(require,module,exports){
"use strict";
var acrolinx_libs_defaults_1 = require("../acrolinx-libs/acrolinx-libs-defaults");
var AdapterInterface_1 = require("./AdapterInterface");
var match_1 = require("../utils/match");
var scrolling_1 = require("../utils/scrolling");
var diff_based_1 = require("../lookup/diff-based");
var utils_1 = require("../utils/utils");
var InputAdapter = (function () {
    function InputAdapter(conf) {
        this.element = AdapterInterface_1.getElementFromAdapterConf(conf);
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
    InputAdapter.prototype.registerCheckResult = function (_checkResult) {
    };
    InputAdapter.prototype.registerCheckCall = function (_checkInfo) {
    };
    InputAdapter.prototype.scrollAndSelect = function (matches) {
        var newBegin = matches[0].range[0];
        var matchLength = match_1.getCompleteFlagLength(matches);
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
        scrolling_1.scrollIntoView(el, this.config.scrollOffsetY);
    };
    InputAdapter.prototype.selectRanges = function (checkId, matches) {
        this.selectMatches(checkId, matches);
    };
    InputAdapter.prototype.selectMatches = function (_checkId, matches) {
        var alignedMatches = diff_based_1.lookupMatches(this.currentHtmlChecking, this.getCurrentText(), matches, 'TEXT');
        if (acrolinx_libs_defaults_1._.isEmpty(alignedMatches)) {
            throw 'Selected flagged content is modified.';
        }
        this.scrollAndSelect(alignedMatches);
        return alignedMatches;
    };
    InputAdapter.prototype.replaceAlignedMatches = function (matches) {
        var reversedMatches = acrolinx_libs_defaults_1._.clone(matches).reverse();
        var el = this.element;
        var text = el.value;
        for (var _i = 0, reversedMatches_1 = reversedMatches; _i < reversedMatches_1.length; _i++) {
            var match = reversedMatches_1[_i];
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
        utils_1.fakeInputEvent(this.element);
    };
    return InputAdapter;
}());
exports.InputAdapter = InputAdapter;

},{"../acrolinx-libs/acrolinx-libs-defaults":2,"../lookup/diff-based":16,"../utils/match":21,"../utils/scrolling":22,"../utils/utils":26,"./AdapterInterface":6}],11:[function(require,module,exports){
"use strict";
var AdapterInterface_1 = require("./AdapterInterface");
var acrolinx_libs_defaults_1 = require("../acrolinx-libs/acrolinx-libs-defaults");
var escaping_1 = require("../utils/escaping");
var alignment_1 = require("../utils/alignment");
function createStartTag(wrapper, id) {
    var allAttributes = acrolinx_libs_defaults_1._.clone(wrapper.attributes);
    if (id) {
        acrolinx_libs_defaults_1._.assign(allAttributes, { id: id });
    }
    var allAttributesString = acrolinx_libs_defaults_1._.map(allAttributes, function (value, key) { return (" " + key + "=\"" + acrolinx_libs_defaults_1._.escape(value) + "\""); }).join('');
    return "<" + wrapper.tagName + allAttributesString + ">";
}
function createEndTag(tagName) {
    return "</" + tagName + ">";
}
function mapBackRangeOfEscapedText(escapeResult, range) {
    return [
        alignment_1.findNewIndex(escapeResult.backwardAlignment, range[0]),
        alignment_1.findNewIndex(escapeResult.backwardAlignment, range[1])
    ];
}
function wrapperConfWithDefaults(opts, defaultTagName) {
    if (defaultTagName === void 0) { defaultTagName = 'div'; }
    var tagName = opts.tagName || defaultTagName;
    if (acrolinx_libs_defaults_1._.includes(tagName, ' ')) {
        console.info("tagName \"" + tagName + "\" contains whitespaces which may lead to unexpected results.");
    }
    return { tagName: tagName, attributes: opts.attributes || {} };
}
var MultiEditorAdapter = (function () {
    function MultiEditorAdapter(config) {
        if (config === void 0) { config = {}; }
        this.config = config;
        if (config.rootElement) {
            this.rootElementWrapper = wrapperConfWithDefaults(config.rootElement, 'html');
        }
        this.adapters = [];
    }
    MultiEditorAdapter.prototype.addSingleAdapter = function (singleAdapter, opts, id) {
        if (opts === void 0) { opts = {}; }
        if (id === void 0) { id = 'acrolinx_integration' + this.adapters.length; }
        this.adapters.push({ id: id, adapter: singleAdapter, wrapper: wrapperConfWithDefaults(opts) });
    };
    MultiEditorAdapter.prototype.removeAllAdapters = function () {
        this.adapters = [];
    };
    MultiEditorAdapter.prototype.extractContentForCheck = function () {
        var _this = this;
        if (this.config.beforeCheck) {
            this.config.beforeCheck(this);
        }
        var deferred = acrolinx_libs_defaults_1.Q.defer();
        var contentExtractionResults = this.adapters.map(function (adapter) { return adapter.adapter.extractContentForCheck(); });
        acrolinx_libs_defaults_1.Q.all(contentExtractionResults).then(function (results) {
            var html = _this.config.documentHeader || '';
            if (_this.rootElementWrapper) {
                html += createStartTag(_this.rootElementWrapper);
            }
            for (var i = 0; i < _this.adapters.length; i++) {
                var extractionResult = results[i];
                if (AdapterInterface_1.hasError(extractionResult)) {
                    continue;
                }
                var adapterContent = extractionResult.content;
                var el = _this.adapters[i];
                var tagName = el.wrapper.tagName;
                var startText = createStartTag(el.wrapper, el.id);
                var isText = el.adapter.getFormat ? el.adapter.getFormat() === 'TEXT' : false;
                var elHtml = void 0;
                if (isText) {
                    el.escapeResult = escaping_1.escapeHtmlCharacters(adapterContent);
                    elHtml = el.escapeResult.escapedText;
                }
                else {
                    elHtml = adapterContent;
                }
                var newTag = startText + elHtml + createEndTag(tagName);
                el.start = html.length + startText.length;
                el.end = html.length + startText.length + elHtml.length;
                html += newTag;
            }
            if (_this.rootElementWrapper) {
                html += createEndTag(_this.rootElementWrapper.tagName);
            }
            var contentExtractionResult = { content: html };
            deferred.resolve(contentExtractionResult);
        });
        return deferred.promise;
    };
    MultiEditorAdapter.prototype.registerCheckCall = function (_checkInfo) {
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
            var remappedMatch = acrolinx_libs_defaults_1._.clone(match);
            var rangeInsideWrapper = [match.range[0] - registeredAdapter.start, match.range[1] - registeredAdapter.start];
            remappedMatch.range = registeredAdapter.escapeResult ?
                mapBackRangeOfEscapedText(registeredAdapter.escapeResult, rangeInsideWrapper) : rangeInsideWrapper;
            map[registeredAdapter.id].matches.push(remappedMatch);
        }
        return map;
    };
    MultiEditorAdapter.prototype.getAdapterForMatch = function (match) {
        return acrolinx_libs_defaults_1._.find(this.adapters, function (adapter) { return (match.range[0] >= adapter.start) && (match.range[1] <= adapter.end); });
    };
    MultiEditorAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
        var map = this.remapMatches(matchesWithReplacement);
        for (var id in map) {
            map[id].adapter.replaceRanges(checkId, map[id].matches);
        }
    };
    return MultiEditorAdapter;
}());
exports.MultiEditorAdapter = MultiEditorAdapter;

},{"../acrolinx-libs/acrolinx-libs-defaults":2,"../utils/alignment":18,"../utils/escaping":19,"./AdapterInterface":6}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AbstractRichtextEditorAdapter_1 = require("./AbstractRichtextEditorAdapter");
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
}(AbstractRichtextEditorAdapter_1.AbstractRichtextEditorAdapter));
exports.TinyMCEAdapter = TinyMCEAdapter;

},{"./AbstractRichtextEditorAdapter":5}],13:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TinyMCEAdapter_1 = require("./TinyMCEAdapter");
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
}(TinyMCEAdapter_1.TinyMCEAdapter));
exports.TinyMCEWordpressAdapter = TinyMCEWordpressAdapter;

},{"./TinyMCEAdapter":12}],14:[function(require,module,exports){
"use strict";
var utils_1 = require("../utils/utils");
var InputAdapter_1 = require("../adapters/InputAdapter");
var ContentEditableAdapter_1 = require("../adapters/ContentEditableAdapter");
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
        if (utils_1.isIFrame(el)) {
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
        var adapterConf = utils_1.assign(conf, { element: editable });
        if (editable.nodeName === 'INPUT' || editable.nodeName === 'TEXTAREA') {
            return new InputAdapter_1.InputAdapter(adapterConf);
        }
        else {
            return new ContentEditableAdapter_1.ContentEditableAdapter(adapterConf);
        }
    });
}
exports.bindAdaptersForCurrentPage = bindAdaptersForCurrentPage;

},{"../adapters/ContentEditableAdapter":9,"../adapters/InputAdapter":10,"../utils/utils":26}],15:[function(require,module,exports){
"use strict";
var acrolinx_libs_defaults_1 = require("../acrolinx-libs/acrolinx-libs-defaults");
exports.SIDEBAR_ID = 'acrolinxFloatingSidebar';
exports.TITLE_BAR_CLASS = 'acrolinxFloatingSidebarTitleBar';
exports.CLOSE_ICON_CLASS = 'acrolinxFloatingSidebarCloseIcon';
exports.SIDEBAR_CONTAINER_ID = 'acrolinxSidebarContainer';
exports.SIDEBAR_DRAG_OVERLAY_ID = 'acrolinxDragOverlay';
exports.SIDEBAR_GLASS_PANE_ID = 'acrolinxFloatingSidebarGlassPane';
exports.RESIZE_ICON_CLASS = 'acrolinxFloatingSidebarResizeIcon';
var initialPos = {
    top: 20,
    left: 20
};
function addStyles() {
    var styleTag = document.createElement('style');
    var head = document.querySelector('head');
    styleTag.innerHTML = "\n      #" + exports.SIDEBAR_ID + " {\n        top: " + initialPos.top + "px;\n        left: " + initialPos.left + "px;\n        position: fixed;\n        width: 300px;\n        padding-top: 0px;\n        cursor: move;\n        background: #3e96db;\n        box-shadow: 5px 5px 30px rgba(0, 0, 0, 0.3);\n        border-radius: 3px;\n        user-select: none;\n        z-index: 10000;\n        -moz-user-select: none;\n        -webkit-user-select: none;\n        -ms-user-select: none;\n      }\n      \n      #" + exports.SIDEBAR_ID + " ." + exports.TITLE_BAR_CLASS + " {\n        font-family: Roboto, sans-serif;\n        line-height: 13px;\n        padding: 5px;\n        font-size: 13px;\n        font-weight: normal;\n        color: white;\n      }\n      \n      #" + exports.SIDEBAR_ID + " ." + exports.CLOSE_ICON_CLASS + " {\n        float: right;\n        cursor: pointer;\n        margin-right: 4px;\n        opacity: 0.7;\n        transition: opacity 0.5s;\n      }\n      \n      #" + exports.SIDEBAR_ID + " ." + exports.CLOSE_ICON_CLASS + ":hover {\n        opacity: 1;\n      }\n      \n      #" + exports.SIDEBAR_ID + " #" + exports.SIDEBAR_CONTAINER_ID + ",\n      #" + exports.SIDEBAR_ID + " #acrolinxDragOverlay,\n      #" + exports.SIDEBAR_ID + " #" + exports.SIDEBAR_CONTAINER_ID + " iframe {\n        position: relative;\n        background: white;\n        height: 100%;\n        border: none;\n      }\n      \n      #" + exports.SIDEBAR_ID + " #" + exports.SIDEBAR_DRAG_OVERLAY_ID + " {\n        position: absolute;\n        top: 20px;\n        left: 0;\n        height: 100%;\n        width: 300px;\n        background: transparent;\n        z-index: 10001;\n      }\n       \n      #" + exports.SIDEBAR_GLASS_PANE_ID + " {\n        position: fixed;\n        width: 100%;\n        height: 100%;\n        margin: 0;\n        padding: 0;\n        top: 0;\n        left: 0;\n        background: white;\n        opacity: 0.6;\n        z-index: 9999;\n      }\n      \n      #" + exports.SIDEBAR_ID + " ." + exports.RESIZE_ICON_CLASS + " {\n        position: absolute;\n        right: 10px;\n        bottom: -10px;\n        width: 10px;\n        height: 10px;\n        font-family: Roboto, sans-serif;\n        line-height: 20px;\n        padding: 5px;\n        font-size: 20px;\n        font-weight: normal;\n        color: #333;\n        z-index: 10002;\n        cursor: move;\n        opacity: 0.7;\n        transition: opacity 0.5s;\n      }\n      \n      #" + exports.SIDEBAR_ID + " ." + exports.RESIZE_ICON_CLASS + ":hover {\n        opacity: 1;\n      }\n    ";
    head.appendChild(styleTag);
}
var TEMPLATE = "\n    <div id=\"" + exports.SIDEBAR_ID + "\">\n      <div class=\"" + exports.TITLE_BAR_CLASS + "\">Acrolinx <span class=\"" + exports.CLOSE_ICON_CLASS + "\" title=\"Close\">&#x274c</span></div>\n      <div id=\"" + exports.SIDEBAR_CONTAINER_ID + "\"></div>\n      <div id=\"" + exports.SIDEBAR_DRAG_OVERLAY_ID + "\"></div>\n      <div class=\"" + exports.RESIZE_ICON_CLASS + "\" title=\"Drag to resize\">&#x21f3;</div>\n    </div>\n  ";
function createDiv(attributes) {
    if (attributes === void 0) { attributes = {}; }
    var el = document.createElement('div');
    acrolinx_libs_defaults_1._.assign(el, attributes);
    return el;
}
function hide(el) {
    el.style.display = 'none';
}
function show(el) {
    el.style.display = 'block';
}
function createNodeFromTemplate(template) {
    return createDiv({ innerHTML: template.trim() }).firstChild;
}
var MAX_INITIAL_HEIGHT = 900;
var MIN_INITIAL_HEIGHT = 400;
var MIN_HEIGHT = 300;
function initFloatingSidebar() {
    var height = Math.max(MIN_INITIAL_HEIGHT, Math.min(MAX_INITIAL_HEIGHT, window.innerHeight - initialPos.top - 40));
    var floatingSidebarElement = createNodeFromTemplate(TEMPLATE);
    var dragOverlay = floatingSidebarElement.querySelector('#' + exports.SIDEBAR_DRAG_OVERLAY_ID);
    var closeIcon = floatingSidebarElement.querySelector('.' + exports.CLOSE_ICON_CLASS);
    var resizeIcon = floatingSidebarElement.querySelector('.' + exports.RESIZE_ICON_CLASS);
    var glassPane = createDiv({ id: exports.SIDEBAR_GLASS_PANE_ID });
    var body = document.querySelector('body');
    var isMoving = false;
    var isResizing = false;
    var relativeMouseDownX = 0;
    var relativeMouseDownY = 0;
    var isVisible = true;
    function move(xpos, ypos) {
        floatingSidebarElement.style.left = xpos + 'px';
        floatingSidebarElement.style.top = ypos + 'px';
    }
    function applyHeight(newHeight) {
        floatingSidebarElement.style.height = newHeight + 'px';
    }
    function onEndDrag() {
        hide(dragOverlay);
        hide(glassPane);
        isMoving = false;
        isResizing = false;
    }
    function hideFloatingSidebar() {
        hide(floatingSidebarElement);
        isVisible = false;
    }
    function toggleVisibility() {
        if (isVisible) {
            hideFloatingSidebar();
        }
        else {
            show(floatingSidebarElement);
            isVisible = true;
        }
    }
    document.addEventListener('mousemove', function (event) {
        if (isMoving) {
            move(Math.max(event.clientX - relativeMouseDownX, 0), Math.max(event.clientY - relativeMouseDownY, 0));
        }
        if (isResizing) {
            var floatingSidebarTop = floatingSidebarElement.getBoundingClientRect().top;
            height = Math.max(event.clientY - floatingSidebarTop, MIN_HEIGHT);
            applyHeight(height);
        }
    });
    function parsePXWithDefault(s, defaultValue) {
        return parseInt(s || '') || defaultValue;
    }
    floatingSidebarElement.addEventListener('mousedown', function (event) {
        var divLeft = parsePXWithDefault(floatingSidebarElement.style.left, initialPos.left);
        var divTop = parsePXWithDefault(floatingSidebarElement.style.top, initialPos.top);
        relativeMouseDownX = event.clientX - divLeft;
        relativeMouseDownY = event.clientY - divTop;
        isMoving = true;
        show(dragOverlay);
        show(glassPane);
    });
    resizeIcon.addEventListener('mousedown', function (event) {
        isResizing = true;
        show(dragOverlay);
        show(glassPane);
        event.stopPropagation();
    });
    document.addEventListener('mouseup', onEndDrag);
    closeIcon.addEventListener('click', hideFloatingSidebar);
    hide(dragOverlay);
    hide(glassPane);
    addStyles();
    applyHeight(height);
    body.appendChild(floatingSidebarElement);
    body.appendChild(glassPane);
    return {
        toggleVisibility: toggleVisibility
    };
}
exports.initFloatingSidebar = initFloatingSidebar;

},{"../acrolinx-libs/acrolinx-libs-defaults":2}],16:[function(require,module,exports){
"use strict";
var acrolinx_libs_defaults_1 = require("../acrolinx-libs/acrolinx-libs-defaults");
var alignment_1 = require("../utils/alignment");
var text_extraction_1 = require("../utils/text-extraction");
var logging_1 = require("../utils/logging");
var diff_match_patch_1 = require("diff-match-patch");
var dmp = new diff_match_patch_1.diff_match_patch();
function createOffsetMappingArray(diffs) {
    var offsetMappingArray = [];
    var offsetCountOld = 0;
    var currentDiffOffset = 0;
    diffs.forEach(function (diff) {
        var action = diff[0], value = diff[1];
        switch (action) {
            case diff_match_patch_1.DIFF_EQUAL:
                offsetCountOld += value.length;
                break;
            case diff_match_patch_1.DIFF_DELETE:
                offsetCountOld += value.length;
                currentDiffOffset -= value.length;
                break;
            case diff_match_patch_1.DIFF_INSERT:
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
exports.createOffsetMappingArray = createOffsetMappingArray;
function rangeContent(content, m) {
    return content.slice(m.range[0], m.range[1]);
}
function lookupMatches(checkedDocument, currentDocument, matches, inputFormat) {
    if (inputFormat === void 0) { inputFormat = 'HTML'; }
    if (acrolinx_libs_defaults_1._.isEmpty(matches)) {
        return [];
    }
    var cleaningResult = inputFormat === 'HTML' ? text_extraction_1.extractText(checkedDocument) : [checkedDocument, []];
    var cleanedCheckedDocument = cleaningResult[0], cleaningOffsetMappingArray = cleaningResult[1];
    var diffs = dmp.diff_main(cleanedCheckedDocument, currentDocument);
    var offsetMappingArray = createOffsetMappingArray(diffs);
    var alignedMatches = matches.map(function (match) {
        var beginAfterCleaning = alignment_1.findNewIndex(cleaningOffsetMappingArray, match.range[0]);
        var endAfterCleaning = alignment_1.findNewIndex(cleaningOffsetMappingArray, match.range[1]);
        var alignedBegin = alignment_1.findNewIndex(offsetMappingArray, beginAfterCleaning);
        var lastCharacterPos = endAfterCleaning - 1;
        var alignedEnd = alignment_1.findNewIndex(offsetMappingArray, lastCharacterPos) + 1;
        return {
            originalMatch: match,
            range: [alignedBegin, alignedEnd],
        };
    });
    var containsModifiedMatches = acrolinx_libs_defaults_1._.some(alignedMatches, function (m) { return rangeContent(currentDocument, m) !== m.originalMatch.content; });
    logging_1.log('checkedDocument', checkedDocument);
    logging_1.log('cleanedCheckedDocument', cleanedCheckedDocument);
    logging_1.log('cleanedCheckedDocumentCodes', cleanedCheckedDocument.split('').map(function (c) { return c.charCodeAt(0); }));
    logging_1.log('currentDocument', currentDocument);
    logging_1.log('currentDocumentCodes', currentDocument.split('').map(function (c) { return c.charCodeAt(0); }));
    logging_1.log('matches', matches);
    logging_1.log('diffs', diffs);
    logging_1.log('alignedMatches', alignedMatches);
    logging_1.log('alignedMatchesContent', alignedMatches.map(function (m) { return rangeContent(currentDocument, m); }));
    return containsModifiedMatches ? [] : alignedMatches;
}
exports.lookupMatches = lookupMatches;

},{"../acrolinx-libs/acrolinx-libs-defaults":2,"../utils/alignment":18,"../utils/logging":20,"../utils/text-extraction":25,"diff-match-patch":1}],17:[function(require,module,exports){
"use strict";
function removeFunctions(object) {
    return JSON.parse(JSON.stringify(object));
}
function postCommandAsMessage(window, command) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    window.postMessage({
        command: command,
        args: removeFunctions(args)
    }, '*');
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
        init: function (_initParameters) {
        },
        checkGlobal: function (_documentContent, _options) {
            return { checkId: 'dummyCheckId' };
        },
        onGlobalCheckRejected: function () {
        },
        invalidateRanges: function (_invalidCheckedDocumentRanges) {
        },
        onVisibleRangesChanged: function (_checkedDocumentRanges) {
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
exports.connectAcrolinxPluginToMessages = connectAcrolinxPluginToMessages;
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
        onInitFinished: function (_initFinishedResult) {
        },
        configure: function (_configuration) {
        },
        requestGlobalCheck: function () {
        },
        onCheckResult: function (_checkResult) {
        },
        selectRanges: function (_checkId, _matches) {
        },
        replaceRanges: function (_checkId, _matchesWithReplacement) {
        },
        download: function (_download) {
        },
        openWindow: function (_urlSpec) {
        }
    };
    injectPostCommandAsMessage(window.parent, acrolinxSidebarPlugin);
    return acrolinxSidebarPlugin;
}
exports.createPluginMessageAdapter = createPluginMessageAdapter;

},{}],18:[function(require,module,exports){
"use strict";
var acrolinx_libs_defaults_1 = require("../acrolinx-libs/acrolinx-libs-defaults");
function findDisplacement(offsetMappingArray, originalIndex) {
    if (offsetMappingArray.length === 0) {
        return 0;
    }
    var index = acrolinx_libs_defaults_1._.sortedIndexBy(offsetMappingArray, { diffOffset: 0, oldPosition: originalIndex + 0.1 }, function (offsetAlign) { return offsetAlign.oldPosition; });
    return index > 0 ? offsetMappingArray[index - 1].diffOffset : 0;
}
exports.findDisplacement = findDisplacement;
function findNewIndex(offsetMappingArray, originalIndex) {
    return originalIndex + findDisplacement(offsetMappingArray, originalIndex);
}
exports.findNewIndex = findNewIndex;

},{"../acrolinx-libs/acrolinx-libs-defaults":2}],19:[function(require,module,exports){
"use strict";
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
exports.escapeHtmlCharacters = escapeHtmlCharacters;

},{}],20:[function(require,module,exports){
"use strict";
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
exports.log = log;
function enableLogging() {
    isEnabled = true;
}
exports.enableLogging = enableLogging;

},{}],21:[function(require,module,exports){
'use strict';
function getCompleteFlagLength(matches) {
    return matches[matches.length - 1].range[1] - matches[0].range[0];
}
exports.getCompleteFlagLength = getCompleteFlagLength;

},{}],22:[function(require,module,exports){
"use strict";
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
exports.scrollIntoView = scrollIntoView;

},{}],23:[function(require,module,exports){
'use strict';
var utils = require("./utils");
exports.SIDEBAR_URL = 'https://acrolinx-sidebar-classic.s3.amazonaws.com/v14/prod/';
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
    if (sidebarUrl === void 0) { sidebarUrl = exports.SIDEBAR_URL; }
    var sidebarBaseUrl = sidebarUrl;
    var getAbsoluteAttributeValue = function (s) { return s.replace(/^.*"(.*)".*$/g, sidebarBaseUrl + '$1'); };
    utils.fetch(sidebarBaseUrl + 'index.html', function (sidebarHtml) {
        var withoutComments = sidebarHtml.replace(/<!--[\s\S]*?-->/g, '');
        var head = document.querySelector('head');
        var css = _.map(withoutComments.match(/href=".*?"/g) || [], getAbsoluteAttributeValue);
        css.forEach(function (ref) {
            head.appendChild(createCSSLinkElement(ref));
        });
        var scripts = _.map(withoutComments.match(/src=".*?"/g) || [], getAbsoluteAttributeValue);
        scripts.forEach(function (ref) {
            head.appendChild(createScriptElement(ref));
        });
    });
}
exports.loadSidebarCode = loadSidebarCode;
function loadSidebarIntoIFrame(config, sidebarIFrameElement, onSidebarLoaded) {
    var sidebarBaseUrl = config.sidebarUrl || exports.SIDEBAR_URL;
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
exports.loadSidebarIntoIFrame = loadSidebarIntoIFrame;

},{"./utils":26}],24:[function(require,module,exports){
"use strict";
var acrolinx_libs_defaults_1 = require("../acrolinx-libs/acrolinx-libs-defaults");
var utils_1 = require("./utils");
var text_extraction_1 = require("./text-extraction");
var EMPTY_TEXT_DOM_MAPPING = Object.freeze({
    text: '',
    domPositions: []
});
function textMapping(text, domPositions) {
    return {
        text: text,
        domPositions: domPositions
    };
}
exports.textMapping = textMapping;
function concatTextMappings(textMappings) {
    return {
        text: textMappings.map(function (tm) { return tm.text; }).join(''),
        domPositions: acrolinx_libs_defaults_1._.flatten(textMappings.map(function (tm) { return tm.domPositions; }))
    };
}
exports.concatTextMappings = concatTextMappings;
function domPosition(node, offset) {
    return {
        node: node,
        offset: offset
    };
}
exports.domPosition = domPosition;
var IGNORED_NODE_NAMES = utils_1.toSet(['SCRIPT', 'STYLE']);
function extractTextDomMapping(node) {
    return concatTextMappings(acrolinx_libs_defaults_1._.map(node.childNodes, function (child) {
        switch (child.nodeType) {
            case Node.ELEMENT_NODE:
                var nodeName = child.nodeName;
                if (IGNORED_NODE_NAMES[nodeName]) {
                    return EMPTY_TEXT_DOM_MAPPING;
                }
                var childMappings = extractTextDomMapping(child);
                if (text_extraction_1.NEW_LINE_TAGS[nodeName]) {
                    var lastChildDomPos = acrolinx_libs_defaults_1._.last(childMappings.domPositions);
                    return {
                        text: childMappings.text + '\n',
                        domPositions: childMappings.domPositions.concat({
                            node: (lastChildDomPos && lastChildDomPos.node) || child,
                            offset: (lastChildDomPos && lastChildDomPos.offset) || 0
                        })
                    };
                }
                return childMappings;
            case Node.TEXT_NODE:
            default:
                var textContent = child.textContent != null ? child.textContent : '';
                return textMapping(textContent, acrolinx_libs_defaults_1._.times(textContent.length, function (i) { return domPosition(child, i); }));
        }
    }));
}
exports.extractTextDomMapping = extractTextDomMapping;
function getEndDomPos(endIndex, domPositions) {
    var index = domPositions[Math.max(Math.min(endIndex, domPositions.length) - 1, 0)];
    return {
        node: index.node,
        offset: index.offset + 1
    };
}
exports.getEndDomPos = getEndDomPos;

},{"../acrolinx-libs/acrolinx-libs-defaults":2,"./text-extraction":25,"./utils":26}],25:[function(require,module,exports){
"use strict";
var acrolinx_libs_defaults_1 = require("../acrolinx-libs/acrolinx-libs-defaults");
var utils_1 = require("./utils");
var REPLACE_SCRIPTS_REGEXP = '<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\/script>';
var REPLACE_STYLES_REGEXP = '<style\\b[^<]*(?:(?!<\\/style>)<[^<]*)*<\/style>';
var REPLACE_TAG_REGEXP = '<([^>]+)>';
var REPLACE_ENTITY_REGEXP = '&.*?;';
var REPLACE_TAGS_PARTS = [REPLACE_SCRIPTS_REGEXP, REPLACE_STYLES_REGEXP, REPLACE_TAG_REGEXP, REPLACE_ENTITY_REGEXP];
var REPLACE_TAGS_REGEXP = '(' + REPLACE_TAGS_PARTS.join('|') + ')';
exports.NEW_LINE_TAGS = utils_1.toSet(['BR', 'P', 'DIV']);
exports.AUTO_SELF_CLOSING_LINE_TAGS = utils_1.toSet(['BR']);
function getTagReplacement(completeTag) {
    var _a = ((/^<(\/?)(\w+)/i).exec(completeTag.toUpperCase()) || []).slice(1), _b = _a[0], slash1 = _b === void 0 ? '' : _b, _c = _a[1], tagName = _c === void 0 ? '' : _c, _d = _a[2], slash2 = _d === void 0 ? '' : _d;
    if (tagName) {
        if (exports.AUTO_SELF_CLOSING_LINE_TAGS[tagName] ||
            (exports.NEW_LINE_TAGS[tagName] && (slash1 || slash2))) {
            return '\n';
        }
    }
    return '';
}
function extractText(s) {
    var regExp = new RegExp(REPLACE_TAGS_REGEXP, 'ig');
    var offsetMapping = [];
    var currentDiffOffset = 0;
    var resultText = s.replace(regExp, function (tagOrEntity, _p1, _p2, offset) {
        var rep = acrolinx_libs_defaults_1._.startsWith(tagOrEntity, '&') ? decodeEntities(tagOrEntity) : getTagReplacement(tagOrEntity);
        currentDiffOffset -= tagOrEntity.length - rep.length;
        offsetMapping.push({
            oldPosition: offset + tagOrEntity.length,
            diffOffset: currentDiffOffset
        });
        return rep;
    });
    return [resultText, offsetMapping];
}
exports.extractText = extractText;
function decodeEntities(entity) {
    var el = document.createElement('div');
    el.innerHTML = entity;
    return el.textContent || '';
}

},{"../acrolinx-libs/acrolinx-libs-defaults":2,"./utils":26}],26:[function(require,module,exports){
"use strict";
var acrolinx_libs_defaults_1 = require("../acrolinx-libs/acrolinx-libs-defaults");
function logTime(text, f) {
    var startTime = Date.now();
    var result = f();
    console.log("Duration of \"" + text + ":\"", Date.now() - startTime);
    return result;
}
exports.logTime = logTime;
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
exports.fetch = fetch;
function isIFrame(el) {
    return el.nodeName === 'IFRAME';
}
exports.isIFrame = isIFrame;
function fakeInputEvent(el) {
    el.dispatchEvent(new CustomEvent('input'));
}
exports.fakeInputEvent = fakeInputEvent;
function parseUrl(href) {
    var aElement = document.createElement('a');
    aElement.href = href;
    if (aElement.host === '') {
        aElement.href = aElement.href;
    }
    var protocol = aElement.protocol, host = aElement.host, hostname = aElement.hostname, port = aElement.port, pathname = aElement.pathname, hash = aElement.hash;
    return { protocol: protocol, host: host, hostname: hostname, port: port, pathname: pathname, hash: hash };
}
exports.parseUrl = parseUrl;
function isFromSameOrigin(url) {
    var _a = parseUrl(url), protocol = _a.protocol, host = _a.host;
    return location.protocol === protocol && location.host === host;
}
exports.isFromSameOrigin = isFromSameOrigin;
function toSet(keys) {
    return Object.freeze(acrolinx_libs_defaults_1._.zipObject(keys, keys.map(acrolinx_libs_defaults_1._.constant(true))));
}
exports.toSet = toSet;
function assign(obj, update) {
    return acrolinx_libs_defaults_1._.assign({}, obj, update);
}
exports.assign = assign;

},{"../acrolinx-libs/acrolinx-libs-defaults":2}]},{},[4]);
