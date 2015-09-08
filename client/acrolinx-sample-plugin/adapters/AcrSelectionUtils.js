/**
 * Created by pricope on 9/8/2015.
 */
var AcrSelectionUtils = {
  isFlagContainsOnlySpecialChar: function (flaggedContent) {
    var pattern = /\w/g;
    return !pattern.test(flaggedContent);
  },

  replaceRangeContent: function (range, replacementText) {
    range.deleteContents();
    range.insertNode(range.createContextualFragment(replacementText));
  },
  getTextContent: function (html) {
    var tmpHTMLElement = $('<div/>').html(html);
    return tmpHTMLElement.text().replace(/\t+/g, '');
  },


  escapeRegExp: function (string) {
    return string.replace(/([\".*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  },

  /* Add word boundary only in following three cases
   * 1. The very next character of the match is also valid word character
   * 2. When the last character of the match is not hyphen (45)
   * 3. When atleast one character of flagged word is a 'word' character
   * (#3) is used to handle flags containing only punctuations
   */
  createSearchPattern: function (matches,currentHtmlChecking) {
    var searchPattern = matches[0].textContent,
      wordBoundary = '\\b';

    if (AcrSelectionUtils.shouldApplyWordBoundary(matches,currentHtmlChecking) === true) {
      searchPattern = wordBoundary + searchPattern + wordBoundary;
    }
    return searchPattern;
  },

  shouldApplyWordBoundary: function (matches,currentHtmlChecking) {
    var offset = matches[matches.length - 1].range[1],
      lastChar,
      nextChar,
      firstChar,
      flaggedWords,
      firstFlaggedWord,
      lastFlaggedWord;

    nextChar = AcrSelectionUtils.getFlagContents(offset, offset + 1,currentHtmlChecking);
    flaggedWords = matches[0].content.split(/\\s+/);
    firstFlaggedWord = flaggedWords[0];
    firstChar = firstFlaggedWord.substr(0, 1);
    lastFlaggedWord = firstFlaggedWord;

    if (flaggedWords.length > 1) {
      lastFlaggedWord = flaggedWords[1];
    }

    lastChar = lastFlaggedWord.substr(lastFlaggedWord.length - 1, 1);

    // Single flagged word and if word contains apostrophe within, then don't use word boundary
    // as the suggestion for "dan't" is coming as "da", which is part of word :/
    /*
     if(flaggedWords.length ==1){
     if(firstFlaggedWord.indexOf('\'') < firstFlaggedWord.length){
     return false;
     }
     }
     */

    if ((lastFlaggedWord.indexOf('&') > -1) && (lastFlaggedWord.indexOf(';') > -1) && (lastFlaggedWord.indexOf(';') > lastFlaggedWord.indexOf('&'))) {
      return false;
    }

    if ((firstFlaggedWord.indexOf('&') > -1) && (firstFlaggedWord.indexOf(';') > -1) && (firstFlaggedWord.indexOf(';') > firstFlaggedWord.indexOf('&'))) {
      return false;
    }

    if ((AcrSelectionUtils.isAlphaNumeral(firstChar) && AcrSelectionUtils.isAlphaNumeral(lastChar) && AcrSelectionUtils.isAlphaNumeral(nextChar)) &&
      lastChar.charCodeAt(0) !== 45 && !AcrSelectionUtils.isFlagContainsOnlySpecialChar(matches[0].htmlContent)) {
      return true;
    }
    return false;
  },

  isAlphaNumeral: function (character) {

    if ((character.charCodeAt(0) >= 48 && character.charCodeAt(0) <= 90 ) ||
      (character.charCodeAt(0) >= 97 && character.charCodeAt(0) <= 126)) {
      return true;
    }
    return false;
  },

  getFlagContents: function (begin, end,currentHtmlChecking) {
    return currentHtmlChecking.substr(begin, end - begin);
  },

  addPropertiesToMatches: function (matches,currentHtmlChecking) {
    var textContent,
      htmlContentBeforeFlag,
      textContentBeforeFlag,
      regexForHTMLTag,
      match,
      startOffset = matches[0].range[0],
      endOffset = matches[matches.length - 1].range[1];

    // Convert html offset to text offset
    htmlContentBeforeFlag = AcrSelectionUtils.getFlagContents(0, startOffset,currentHtmlChecking);
    textContentBeforeFlag = AcrSelectionUtils.getTextContent(htmlContentBeforeFlag);
    matches[0].textOffset = textContentBeforeFlag.length;
    if (matches[0].textOffset === 0) {
      //pattern to get html tags
      regexForHTMLTag = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*/gm;

      while ((match = regexForHTMLTag.exec(htmlContentBeforeFlag)) !== null) {
        break;
      }

      startOffset = matches[0].textOffset + match.input.length;
    }
    matches[0].htmlContent = AcrSelectionUtils.getFlagContents(startOffset, endOffset,currentHtmlChecking);

    // Convert Flag HTML into inner Text
    textContent = AcrSelectionUtils.getTextContent(matches[0].htmlContent);
    textContent = AcrSelectionUtils.escapeRegExp(textContent);
    matches[0].textContent = textContent;
    matches[0].searchPattern = AcrSelectionUtils.createSearchPattern(matches,currentHtmlChecking);
    return matches;
  },

  findBestMatchOffset: function (flagHtmlOffsets, matches) {
    var minOffsetIndex = -1,
      originalFlagOffset = matches[0].textOffset;

    if (flagHtmlOffsets.length > 0) {
      minOffsetIndex = 0;
      var minOffset = Math.abs(flagHtmlOffsets[minOffsetIndex] - originalFlagOffset);

      for (var i = 0; i < flagHtmlOffsets.length; i++) {
        if (Math.abs(flagHtmlOffsets[i] - originalFlagOffset) < minOffset) {
          minOffsetIndex = i;
          minOffset = Math.abs(flagHtmlOffsets[minOffsetIndex] - originalFlagOffset);
        }
      }
    }
    return minOffsetIndex;
  },



  findAllFlagOffsets: function (paragraph, stringToPattern) {
    var matchedWords,
      pattern,
      flagOffsets = [];

    pattern = new RegExp(stringToPattern, 'gm');
    var lastIndex = null;
    while ((matchedWords = pattern.exec(paragraph)) !== null) {
      var index = matchedWords.index;
      if (lastIndex === index) {
        break;
      }
      lastIndex = index;
      flagOffsets.push(index);
    }

    return flagOffsets;
  },


};