var acrolinxLibs;
(function (acrolinxLibs) {
    'use strict';
    var originalAcrolinxLibs = window['acrolinxLibs'] || {};
    acrolinxLibs.Q = originalAcrolinxLibs.Q || window['Q'];
    acrolinxLibs.$ = originalAcrolinxLibs.$ || window['$'];
    acrolinxLibs._ = originalAcrolinxLibs._ || window['_'];
})(acrolinxLibs || (acrolinxLibs = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var utils;
        (function (utils) {
            var selection;
            (function (selection) {
                'use strict';
                function isFlagContainsOnlySpecialChar(flaggedContent) {
                    var pattern = /\w/g;
                    return !pattern.test(flaggedContent);
                }
                selection.isFlagContainsOnlySpecialChar = isFlagContainsOnlySpecialChar;
                function replaceRangeContent(range, replacementText) {
                    range.deleteContents();
                    range.insertNode(range.createContextualFragment(replacementText));
                }
                selection.replaceRangeContent = replaceRangeContent;
                function getTextContent(html) {
                    var tmpHTMLElement = acrolinxLibs.$('<div/>').html(html);
                    return tmpHTMLElement.text().replace(/\t+/g, '');
                }
                selection.getTextContent = getTextContent;
                function escapeRegExp(string) {
                    return string.replace(/([\".*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
                }
                selection.escapeRegExp = escapeRegExp;
                function createSearchPattern(matches, currentHtmlChecking) {
                    var searchPattern = matches[0].textContent, wordBoundary = '\\b';
                    if (shouldApplyWordBoundary(matches, currentHtmlChecking) === true) {
                        searchPattern = wordBoundary + searchPattern + wordBoundary;
                    }
                    return searchPattern;
                }
                selection.createSearchPattern = createSearchPattern;
                function shouldApplyWordBoundary(matches, currentHtmlChecking) {
                    var offset = matches[matches.length - 1].range[1], lastChar, nextChar, firstChar, flaggedWords, firstFlaggedWord, lastFlaggedWord;
                    nextChar = getFlagContents(offset, offset + 1, currentHtmlChecking);
                    flaggedWords = matches[0].textContent.split(/\\s+/);
                    firstFlaggedWord = flaggedWords[0];
                    firstChar = firstFlaggedWord.substr(0, 1);
                    lastFlaggedWord = firstFlaggedWord;
                    if (flaggedWords.length > 1) {
                        lastFlaggedWord = flaggedWords[1];
                    }
                    lastChar = lastFlaggedWord.substr(lastFlaggedWord.length - 1, 1);
                    if ((lastFlaggedWord.indexOf('&') > -1) && (lastFlaggedWord.indexOf(';') > -1) && (lastFlaggedWord.indexOf(';') > lastFlaggedWord.indexOf('&'))) {
                        return false;
                    }
                    if ((firstFlaggedWord.indexOf('&') > -1) && (firstFlaggedWord.indexOf(';') > -1) && (firstFlaggedWord.indexOf(';') > firstFlaggedWord.indexOf('&'))) {
                        return false;
                    }
                    if ((isAlphaNumeral(firstChar) && isAlphaNumeral(lastChar) && isAlphaNumeral(nextChar)) &&
                        lastChar.charCodeAt(0) !== 45 && !isFlagContainsOnlySpecialChar(matches[0].htmlContent)) {
                        return true;
                    }
                    return false;
                }
                selection.shouldApplyWordBoundary = shouldApplyWordBoundary;
                function isAlphaNumeral(character) {
                    if ((character.charCodeAt(0) >= 48 && character.charCodeAt(0) <= 90) ||
                        (character.charCodeAt(0) >= 97 && character.charCodeAt(0) <= 126)) {
                        return true;
                    }
                    return false;
                }
                selection.isAlphaNumeral = isAlphaNumeral;
                function getFlagContents(begin, end, currentHtmlChecking) {
                    return currentHtmlChecking.substr(begin, end - begin);
                }
                selection.getFlagContents = getFlagContents;
                function addPropertiesToMatches(matches, currentHtmlChecking) {
                    var textContent, htmlContentBeforeFlag, textContentBeforeFlag, regexForHTMLTag, match, startOffset = matches[0].range[0], endOffset = matches[matches.length - 1].range[1];
                    htmlContentBeforeFlag = getFlagContents(0, startOffset, currentHtmlChecking);
                    textContentBeforeFlag = getTextContent(htmlContentBeforeFlag);
                    matches[0].textOffset = textContentBeforeFlag.length;
                    if (matches[0].textOffset === 0) {
                        regexForHTMLTag = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*/gm;
                        if ((match = regexForHTMLTag.exec(htmlContentBeforeFlag)) !== null) {
                            startOffset = matches[0].textOffset + match.input.length;
                        }
                    }
                    matches[0].htmlContent = getFlagContents(startOffset, endOffset, currentHtmlChecking);
                    textContent = getTextContent(matches[0].htmlContent);
                    textContent = escapeRegExp(textContent);
                    matches[0].textContent = textContent;
                    matches[0].searchPattern = createSearchPattern(matches, currentHtmlChecking);
                    return matches;
                }
                selection.addPropertiesToMatches = addPropertiesToMatches;
                function findBestMatchOffset(flagHtmlOffsets, matches) {
                    var minOffsetIndex = -1, originalFlagOffset = matches[0].textOffset;
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
                }
                selection.findBestMatchOffset = findBestMatchOffset;
                function findAllFlagOffsets(paragraph, stringToPattern) {
                    var matchedWords, pattern, flagOffsets = [];
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
                }
                selection.findAllFlagOffsets = findAllFlagOffsets;
            })(selection = utils.selection || (utils.selection = {}));
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
            var AcrSelectionUtils = acrolinx.plugins.utils.selection;
            var CKEditorAdapter = (function () {
                function CKEditorAdapter(conf) {
                    this.config = conf;
                    this.editorId = conf.editorId;
                    this.editor = null;
                }
                CKEditorAdapter.prototype.getEditor = function () {
                    if (this.editor === null) {
                        if (CKEDITOR.instances.hasOwnProperty(this.editorId)) {
                            this.editor = CKEDITOR.instances[this.editorId];
                        }
                    }
                    return this.editor;
                };
                CKEditorAdapter.prototype.getEditorDocument = function () {
                    try {
                        return this.getEditor().document.$;
                    }
                    catch (error) {
                        throw error;
                    }
                };
                CKEditorAdapter.prototype.getEditableElement = function () {
                    return this.editor.editable().$;
                };
                CKEditorAdapter.prototype.getCurrentText = function () {
                    try {
                        return rangy.innerText(this.getEditorDocument());
                    }
                    catch (error) {
                        throw error;
                    }
                };
                CKEditorAdapter.prototype.getHTML = function () {
                    return this.getEditor().getData();
                };
                CKEditorAdapter.prototype.createRange = function (begin, length) {
                    var editableElement = this.getEditableElement();
                    var range = rangy.createRange(this.getEditorDocument());
                    range.setStart(editableElement, 0);
                    range.setEnd(editableElement, 0);
                    range.moveStart('character', begin);
                    range.moveEnd('character', length);
                    return range;
                };
                CKEditorAdapter.prototype.selectText = function (begin, length) {
                    var range = this.createRange(begin, length);
                    var selection = rangy.getSelection(this.getEditorDocument());
                    selection.setSingleRange(range);
                    return range;
                };
                CKEditorAdapter.prototype.scrollAndSelect = function (matches) {
                    var newBegin, matchLength, selection1, selection2, range1, range2, doc;
                    newBegin = matches[0].foundOffset;
                    matchLength = matches[0].flagLength + 1;
                    range1 = this.selectText(newBegin, matchLength);
                    selection1 = this.getEditor().getSelection();
                    if (selection1) {
                        try {
                            selection1.scrollIntoView();
                        }
                        catch (error) {
                        }
                    }
                    doc = this.getEditorDocument();
                    selection2 = rangy.getSelection(doc);
                    range2 = rangy.createRange(doc);
                    range2.setStart(range1.startContainer, range1.startOffset);
                    range2.setEnd(range1.endContainer, range1.endOffset);
                    selection2.setSingleRange(range2);
                    return range2;
                };
                CKEditorAdapter.prototype.extractHTMLForCheck = function () {
                    this.html = this.getHTML();
                    this.currentHtmlChecking = this.html;
                    if (this.editor.mode === 'wysiwyg') {
                        this.checkStartTime = Date.now();
                        if (this.html === '') {
                            this.html = '<span> </span>';
                        }
                    }
                    else {
                        if (this.isCheckingNow) {
                            this.isCheckingNow = false;
                        }
                        else {
                            return { error: "Action is not permitted in Source mode." };
                        }
                    }
                    return { html: this.html };
                };
                CKEditorAdapter.prototype.registerCheckCall = function (checkInfo) {
                };
                CKEditorAdapter.prototype.registerCheckResult = function (checkResult) {
                    this.isCheckingNow = false;
                    this.currentHtmlChecking = this.html;
                    this.prevCheckedHtml = this.currentHtmlChecking;
                    return [];
                };
                CKEditorAdapter.prototype.selectRanges = function (checkId, matches) {
                    if (this.editor.mode === 'wysiwyg') {
                        this.selectMatches(checkId, matches);
                    }
                    else {
                        window.alert('Action is not permitted in Source mode.');
                    }
                };
                CKEditorAdapter.prototype.selectMatches = function (checkId, matches) {
                    var rangyFlagOffsets, index, offset;
                    var rangyText = this.getCurrentText();
                    matches = AcrSelectionUtils.addPropertiesToMatches(matches, this.currentHtmlChecking);
                    rangyFlagOffsets = AcrSelectionUtils.findAllFlagOffsets(rangyText, matches[0].searchPattern);
                    index = AcrSelectionUtils.findBestMatchOffset(rangyFlagOffsets, matches);
                    offset = rangyFlagOffsets[index];
                    matches[0].foundOffset = offset;
                    if (matches[0].content.length >= matches[0].range[1] - matches[0].range[0]) {
                        matches[0].textContent = matches[0].textContent.replace(/\\/g, '');
                    }
                    else {
                        matches[0].textContent = matches[0].textContent.replace(/\\\\/g, '\\');
                    }
                    matches[0].flagLength = matches[0].textContent.length - 1;
                    if (offset >= 0) {
                        this.scrollAndSelect(matches);
                    }
                    else {
                        throw 'Selected flagged content is modified.';
                    }
                };
                CKEditorAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    var replacementText, selectedRange, selectionFromCharPos = 1;
                    if (this.editor.mode === 'wysiwyg') {
                        try {
                            this.selectMatches(checkId, matchesWithReplacement);
                            if (matchesWithReplacement[0].foundOffset + matchesWithReplacement[0].flagLength < this.getCurrentText().length) {
                                matchesWithReplacement[0].foundOffset += selectionFromCharPos;
                                matchesWithReplacement[0].flagLength -= selectionFromCharPos;
                            }
                            selectedRange = this.scrollAndSelect(matchesWithReplacement);
                        }
                        catch (error) {
                            console.log(error);
                            return;
                        }
                        replacementText = acrolinxLibs._.map(matchesWithReplacement, 'replacement').join('');
                        AcrSelectionUtils.replaceRangeContent(selectedRange, replacementText);
                        if ((matchesWithReplacement[0].foundOffset + matchesWithReplacement[0].flagLength) < this.getCurrentText().length) {
                            if (selectionFromCharPos > 0) {
                                this.selectText(matchesWithReplacement[0].foundOffset - selectionFromCharPos, selectionFromCharPos);
                                rangy.getSelection(this.getEditorDocument()).nativeSelection.deleteFromDocument();
                            }
                            matchesWithReplacement[0].foundOffset -= selectionFromCharPos;
                            matchesWithReplacement[0].flagLength += selectionFromCharPos;
                        }
                        this.selectText(matchesWithReplacement[0].foundOffset, replacementText.length);
                    }
                    else {
                        window.alert('Action is not permitted in Source mode.');
                    }
                };
                return CKEditorAdapter;
            }());
            adapter.CKEditorAdapter = CKEditorAdapter;
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
            var AcrSelectionUtils = acrolinx.plugins.utils.selection;
            var InputAdapter = (function () {
                function InputAdapter(element) {
                    if (element.editorId !== undefined) {
                        this.element = document.getElementById(element.editorId);
                    }
                    else {
                        this.element = element;
                    }
                }
                InputAdapter.prototype.getHTML = function () {
                    return acrolinxLibs.$(this.element).val();
                };
                InputAdapter.prototype.getEditorDocument = function () {
                    try {
                        return this.element.ownerDocument;
                    }
                    catch (error) {
                        throw error;
                    }
                };
                InputAdapter.prototype.getCurrentText = function () {
                    try {
                        return this.getHTML();
                    }
                    catch (error) {
                        throw error;
                    }
                };
                InputAdapter.prototype.extractHTMLForCheck = function () {
                    this.html = this.getHTML();
                    this.currentHtmlChecking = this.html;
                    return { html: this.html };
                };
                InputAdapter.prototype.registerCheckResult = function (checkResult) {
                    return [];
                };
                InputAdapter.prototype.registerCheckCall = function (checkInfo) {
                };
                InputAdapter.prototype.selectText = function (begin, length) {
                    var doc = this.getEditorDocument();
                    var selection = rangy.getSelection(doc);
                    var range = rangy.createRange(doc);
                    range.setStart(this.element, 0);
                    range.moveStart('character', begin);
                    range.moveEnd('character', length);
                    selection.setSingleRange(range);
                    return range;
                };
                InputAdapter.prototype.scrollIntoView2 = function (sel) {
                    var range = sel.getRangeAt(0);
                    var tmp = range.cloneRange();
                    tmp.collapse();
                    var text = document.createElement('span');
                    tmp.startContainer.parentNode.insertBefore(text, tmp.startContainer);
                    text.scrollIntoView();
                    text.remove();
                };
                InputAdapter.prototype.scrollAndSelect = function (matches) {
                    var newBegin, matchLength;
                    var $ = acrolinxLibs.$;
                    newBegin = matches[0].foundOffset;
                    matchLength = matches[0].flagLength + 1;
                    $(this.element).focus();
                    $(this.element).setSelection(newBegin, newBegin + matchLength);
                    $(this.element)[0].scrollIntoView();
                    var wpContainer = $('#wp-content-editor-container');
                    if (wpContainer.length > 0) {
                        window.scrollBy(0, -50);
                    }
                };
                InputAdapter.prototype.selectRanges = function (checkId, matches) {
                    this.selectMatches(checkId, matches);
                };
                InputAdapter.prototype.selectMatches = function (checkId, matches) {
                    var rangyFlagOffsets, index, offset;
                    var rangyText = this.getCurrentText();
                    matches = AcrSelectionUtils.addPropertiesToMatches(matches, this.currentHtmlChecking);
                    rangyFlagOffsets = AcrSelectionUtils.findAllFlagOffsets(rangyText, matches[0].searchPattern);
                    index = AcrSelectionUtils.findBestMatchOffset(rangyFlagOffsets, matches);
                    offset = rangyFlagOffsets[index];
                    matches[0].foundOffset = offset;
                    if (matches[0].content.length >= matches[0].range[1] - matches[0].range[0]) {
                        matches[0].textContent = matches[0].textContent.replace(/\\/g, '');
                    }
                    else {
                        matches[0].textContent = matches[0].textContent.replace(/\\\\/g, '\\');
                    }
                    matches[0].flagLength = matches[0].textContent.length - 1;
                    if (offset >= 0) {
                        this.scrollAndSelect(matches);
                    }
                    else {
                        throw 'Selected flagged content is modified.';
                    }
                };
                InputAdapter.prototype.replaceSelection = function (content) {
                    acrolinxLibs.$(this.element).replaceSelectedText(content, "select");
                };
                InputAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    var replacementText, selectionFromCharPos = 0;
                    try {
                        this.selectMatches(checkId, matchesWithReplacement);
                        if (matchesWithReplacement[0].foundOffset + matchesWithReplacement[0].flagLength < this.getCurrentText().length) {
                            matchesWithReplacement[0].foundOffset += selectionFromCharPos;
                            matchesWithReplacement[0].flagLength -= selectionFromCharPos;
                        }
                        this.scrollAndSelect(matchesWithReplacement);
                    }
                    catch (error) {
                        console.log(error);
                        return;
                    }
                    replacementText = acrolinxLibs._.map(matchesWithReplacement, 'replacement').join('');
                    this.replaceSelection(replacementText);
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
        var adapter;
        (function (adapter_1) {
            'use strict';
            var MultiEditorAdapter = (function () {
                function MultiEditorAdapter(conf) {
                    this.config = conf;
                    this.adapters = [];
                }
                MultiEditorAdapter.prototype.addSingleAdapter = function (singleAdapter, wrapper, id) {
                    if (wrapper === undefined) {
                        wrapper = 'div';
                    }
                    if (id === undefined) {
                        id = 'acrolinx_integration' + this.adapters.length;
                    }
                    this.adapters.push({ id: id, adapter: singleAdapter, wrapper: wrapper });
                };
                MultiEditorAdapter.prototype.getWrapperTag = function (wrapper) {
                    var tag = wrapper.split(" ")[0];
                    return tag;
                };
                MultiEditorAdapter.prototype.extractHTMLForCheck = function () {
                    var Q = acrolinxLibs.Q;
                    var deferred = Q.defer();
                    var htmls = [];
                    for (var i = 0; i < this.adapters.length; i++) {
                        var el = this.adapters[i];
                        htmls.push(el.adapter.extractHTMLForCheck());
                    }
                    Q.all(htmls).then(acrolinxLibs._.bind(function (results) {
                        var html = '';
                        for (var i = 0; i < this.adapters.length; i++) {
                            var el = this.adapters[i];
                            var tag = this.getWrapperTag(el.wrapper);
                            var startText = '<' + el.wrapper + ' id="' + el.id + '">';
                            var elHtml = results[i].html;
                            var newTag = startText + elHtml + '</' + tag + '>';
                            el.start = html.length + startText.length;
                            el.end = html.length + startText.length + elHtml.length;
                            html += newTag;
                        }
                        this.html = html;
                        console.log(this.html);
                        deferred.resolve({ html: this.html });
                    }, this));
                    return deferred.promise;
                };
                MultiEditorAdapter.prototype.registerCheckCall = function (checkInfo) {
                };
                MultiEditorAdapter.prototype.registerCheckResult = function (checkResult) {
                    this.checkResult = checkResult;
                    this.adapters.forEach(function (entry) {
                        entry.adapter.registerCheckResult(checkResult);
                    });
                    return [];
                };
                MultiEditorAdapter.prototype.selectRanges = function (checkId, matches) {
                    var map = this.remapMatches(matches);
                    for (var id in map) {
                        map[id].adapter.selectRanges(checkId, map[id].matches);
                    }
                };
                MultiEditorAdapter.prototype.remapMatches = function (matches) {
                    var map = {};
                    for (var i = 0; i < matches.length; i++) {
                        var match = acrolinxLibs._.clone(matches[i]);
                        match.range = acrolinxLibs._.clone(matches[i].range);
                        var adapter = this.getAdapterForMatch(match);
                        if (!map.hasOwnProperty(adapter.id)) {
                            map[adapter.id] = { matches: [], adapter: adapter.adapter };
                        }
                        match.range[0] -= adapter.start;
                        match.range[1] -= adapter.start;
                        map[adapter.id].matches.push(match);
                    }
                    return map;
                };
                MultiEditorAdapter.prototype.getAdapterForMatch = function (match) {
                    for (var i = 0; i < this.adapters.length; i++) {
                        var el = this.adapters[i];
                        if ((match.range[0] >= el.start) && (match.range[1] <= el.end)) {
                            return el;
                        }
                    }
                    return null;
                };
                MultiEditorAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    var map = this.remapMatches(matchesWithReplacement);
                    for (var id in map) {
                        map[id].adapter.replaceRanges(checkId, map[id].matches);
                    }
                };
                return MultiEditorAdapter;
            }());
            adapter_1.MultiEditorAdapter = MultiEditorAdapter;
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
            var SimpleTextAdapter = (function () {
                function SimpleTextAdapter(conf) {
                    this.config = conf;
                }
                SimpleTextAdapter.prototype.selectText = function (begin, length) {
                    var editorElement = this.getEditorElement();
                    var r = rangy.createRange();
                    r.setStart(editorElement, 0);
                    r.setEnd(editorElement, 0);
                    r.moveStart('character', begin);
                    r.moveEnd('character', length);
                    var sel = rangy.getSelection();
                    sel.setSingleRange(r);
                };
                SimpleTextAdapter.prototype.findRangesPositionInPlainText = function (text, matches) {
                    var rangesText = matches.map(function (match) {
                        return match.content;
                    }).join('');
                    var indexOfRangesText = text.indexOf(rangesText);
                    if (indexOfRangesText > -1) {
                        return {
                            start: indexOfRangesText,
                            length: rangesText.length
                        };
                    }
                    else {
                        return null;
                    }
                };
                SimpleTextAdapter.prototype.getEditor = function () {
                    return document.getElementById(this.config.editorId);
                };
                SimpleTextAdapter.prototype.getEditorElement = function () {
                    return this.getEditor();
                };
                SimpleTextAdapter.prototype.getCurrentText = function () {
                    return rangy.innerText(this.getEditorElement());
                };
                SimpleTextAdapter.prototype.getHTML = function () {
                    return this.getEditor().innerHTML;
                };
                SimpleTextAdapter.prototype.extractHTMLForCheck = function () {
                    return { html: this.getHTML() };
                };
                SimpleTextAdapter.prototype.registerCheckCall = function (checkInfo) {
                };
                SimpleTextAdapter.prototype.registerCheckResult = function (checkResult) {
                    return [];
                };
                SimpleTextAdapter.prototype.selectRanges = function (checkId, matches) {
                    var positionInPlainText = this.findRangesPositionInPlainText(this.getCurrentText(), matches);
                    if (positionInPlainText) {
                        this.selectText(positionInPlainText.start, positionInPlainText.length);
                    }
                    else {
                        window.alert('Sorry, but I can\'t select this issue.');
                    }
                };
                SimpleTextAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    this.selectRanges(checkId, matchesWithReplacement);
                    var replacementText = matchesWithReplacement.map(function (matcheWithReplacement) {
                        return matcheWithReplacement.replacement;
                    }).join('');
                    var sel = rangy.getSelection();
                    var range = sel.getRangeAt(0);
                    range.deleteContents();
                    var node = range.createContextualFragment(replacementText);
                    range.insertNode(node);
                };
                return SimpleTextAdapter;
            }());
            adapter.SimpleTextAdapter = SimpleTextAdapter;
        })(adapter = plugins.adapter || (plugins.adapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
;
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        var adapter;
        (function (adapter) {
            'use strict';
            var AcrSelectionUtils = acrolinx.plugins.utils.selection;
            var TinyMCEAdapter = (function () {
                function TinyMCEAdapter(conf) {
                    this.config = conf;
                    this.editorId = conf.editorId;
                    this.editor = null;
                }
                TinyMCEAdapter.prototype.getEditor = function () {
                    if (this.editor === null) {
                        this.editor = tinymce.get(this.editorId);
                        console.log("tinymce found", this.editor);
                    }
                    return this.editor;
                };
                TinyMCEAdapter.prototype.getHTML = function () {
                    return this.getEditor().getContent();
                };
                TinyMCEAdapter.prototype.getEditorDocument = function () {
                    try {
                        return this.editor.contentDocument;
                    }
                    catch (error) {
                        throw error;
                    }
                };
                TinyMCEAdapter.prototype.getCurrentText = function () {
                    try {
                        return rangy.innerText(this.getEditorDocument());
                    }
                    catch (error) {
                        throw error;
                    }
                };
                TinyMCEAdapter.prototype.selectText = function (begin, length) {
                    var doc = this.getEditorDocument();
                    var selection = rangy.getSelection(doc);
                    var range = rangy.createRange(doc);
                    range.moveStart('character', begin);
                    range.moveEnd('character', length);
                    selection.setSingleRange(range);
                    return range;
                };
                TinyMCEAdapter.prototype.scrollIntoView2 = function (sel) {
                    var range = sel.getRng();
                    var tmp = range.cloneRange();
                    tmp.collapse();
                    var text = document.createElement('span');
                    tmp.startContainer.parentNode.insertBefore(text, tmp.startContainer);
                    text.scrollIntoView();
                    text.remove();
                };
                TinyMCEAdapter.prototype.scrollAndSelect = function (matches) {
                    var newBegin, matchLength, selection1, range1, range2, newBegin = matches[0].foundOffset;
                    matchLength = matches[0].flagLength + 1;
                    range1 = this.selectText(newBegin, matchLength);
                    selection1 = this.getEditor().selection;
                    if (selection1) {
                        try {
                            this.scrollIntoView2(selection1);
                            var wpContainer = acrolinxLibs.$('#wp-content-editor-container');
                            if (wpContainer.length > 0) {
                                wpContainer.get(0).scrollIntoView();
                            }
                        }
                        catch (error) {
                            console.log("Scrolling Error!");
                        }
                    }
                    range2 = this.selectText(newBegin, matchLength);
                };
                TinyMCEAdapter.prototype.extractHTMLForCheck = function () {
                    this.html = this.getHTML();
                    this.currentHtmlChecking = this.html;
                    return { html: this.html };
                };
                TinyMCEAdapter.prototype.registerCheckCall = function (checkInfo) {
                };
                TinyMCEAdapter.prototype.registerCheckResult = function (checkResult) {
                    this.isCheckingNow = false;
                    this.currentHtmlChecking = this.html;
                    this.prevCheckedHtml = this.currentHtmlChecking;
                    return [];
                };
                TinyMCEAdapter.prototype.selectRanges = function (checkId, matches) {
                    this.selectMatches(checkId, matches);
                };
                TinyMCEAdapter.prototype.selectMatches = function (checkId, matches) {
                    var rangyFlagOffsets, index, offset;
                    var rangyText = this.getCurrentText();
                    matches = AcrSelectionUtils.addPropertiesToMatches(matches, this.currentHtmlChecking);
                    rangyFlagOffsets = AcrSelectionUtils.findAllFlagOffsets(rangyText, matches[0].searchPattern);
                    index = AcrSelectionUtils.findBestMatchOffset(rangyFlagOffsets, matches);
                    offset = rangyFlagOffsets[index];
                    matches[0].foundOffset = offset;
                    if (matches[0].content.length >= matches[0].range[1] - matches[0].range[0]) {
                        matches[0].textContent = matches[0].textContent.replace(/\\/g, '');
                    }
                    else {
                        matches[0].textContent = matches[0].textContent.replace(/\\\\/g, '\\');
                    }
                    matches[0].flagLength = matches[0].textContent.length - 1;
                    if (offset >= 0) {
                        this.scrollAndSelect(matches);
                    }
                    else {
                        throw 'Selected flagged content is modified.';
                    }
                };
                TinyMCEAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    var replacementText, selectionFromCharPos = 1;
                    try {
                        this.selectMatches(checkId, matchesWithReplacement);
                        if (matchesWithReplacement[0].foundOffset + matchesWithReplacement[0].flagLength < this.getCurrentText().length) {
                            matchesWithReplacement[0].foundOffset += selectionFromCharPos;
                            matchesWithReplacement[0].flagLength -= selectionFromCharPos;
                        }
                        this.scrollAndSelect(matchesWithReplacement);
                    }
                    catch (error) {
                        console.log(error);
                        throw error;
                    }
                    replacementText = acrolinxLibs._.map(matchesWithReplacement, 'replacement').join('');
                    this.editor.selection.setContent(replacementText);
                    if ((matchesWithReplacement[0].foundOffset + matchesWithReplacement[0].flagLength) < this.getCurrentText().length) {
                        if (selectionFromCharPos > 0) {
                            this.selectText(matchesWithReplacement[0].foundOffset - selectionFromCharPos, selectionFromCharPos);
                            rangy.getSelection(this.getEditorDocument()).nativeSelection.deleteFromDocument();
                        }
                        matchesWithReplacement[0].foundOffset -= selectionFromCharPos;
                        matchesWithReplacement[0].flagLength += selectionFromCharPos;
                    }
                    this.selectText(matchesWithReplacement[0].foundOffset, replacementText.length);
                };
                return TinyMCEAdapter;
            }());
            adapter.TinyMCEAdapter = TinyMCEAdapter;
        })(adapter = plugins.adapter || (plugins.adapter = {}));
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
var acrolinx;
(function (acrolinx) {
    var plugins;
    (function (plugins) {
        'use strict';
        var clientComponents = [
            {
                id: 'com.acrolinx.sidebarexample',
                name: 'Acrolinx Sidebar Example Client',
                version: '1.2.3.999',
                category: 'MAIN'
            }
        ];
        function initAcrolinxSamplePlugin(config, editorAdapter) {
            var $ = acrolinxLibs.$;
            var $sidebarContainer = $('#' + config.sidebarContainerId);
            var $sidebar = $('<iframe></iframe>');
            $sidebarContainer.append($sidebar);
            var sidebarContentWindow = $sidebar.get(0).contentWindow;
            var adapter = editorAdapter;
            function onSidebarLoaded() {
                function initSidebarOnPremise() {
                    sidebarContentWindow.acrolinxSidebar.init({
                        clientComponents: config.clientComponents || clientComponents,
                        clientSignature: config.clientSignature,
                        showServerSelector: config.hasOwnProperty("showServerSelector") ? config.showServerSelector : true,
                        enableSingleSignOn: config.hasOwnProperty("enableSingleSignOn") ? config.enableSingleSignOn : false,
                        serverAddress: config.serverAddress,
                        defaultCheckSettings: config.defaultCheckSettings
                    });
                }
                console.log('Install acrolinxPlugin in sidebar.');
                sidebarContentWindow.acrolinxPlugin = {
                    requestInit: function () {
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
                    requestGlobalCheckSync: function (html, format, documentReference) {
                        if (html.hasOwnProperty("error")) {
                            window.alert(html.error);
                        }
                        else {
                            var checkInfo = sidebarContentWindow.acrolinxSidebar.checkGlobal(html.html, {
                                inputFormat: format || 'HTML',
                                requestDescription: {
                                    documentReference: documentReference || 'filename.html'
                                }
                            });
                            adapter.registerCheckCall(checkInfo);
                        }
                    },
                    requestGlobalCheck: function () {
                        console.log('requestGlobalCheck');
                        var pHtml = adapter.extractHTMLForCheck();
                        var pFormat = adapter.getFormat ? adapter.getFormat() : null;
                        var pDocumentReference = adapter.getDocumentReference ? adapter.getDocumentReference() : null;
                        if (pHtml.then !== undefined) {
                            var self = this;
                            pHtml.then(function (html) {
                                self.requestGlobalCheckSync(html, pFormat, pDocumentReference);
                            });
                        }
                        else {
                            this.requestGlobalCheckSync(pHtml, pFormat, pDocumentReference);
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
                            sidebarContentWindow.acrolinxSidebar.invalidateRanges(matches.map(function (match) {
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
                            sidebarContentWindow.acrolinxSidebar.invalidateRanges(matchesWithReplacement.map(function (match) {
                                return {
                                    checkId: checkId,
                                    range: match.range
                                };
                            }));
                        }
                    },
                    getRangesOrder: function (checkedDocumentRanges) {
                        console.log('getRangesOrder: ', checkedDocumentRanges);
                        return [];
                    },
                    download: function (download) {
                        console.log('download: ', download.url, download);
                        window.open(download.url);
                    },
                    verifyRanges: function (checkedDocumentParts) {
                        console.log('verifyRanges: ', checkedDocumentParts);
                        return [];
                    },
                    disposeCheck: function (checkId) {
                        console.log('disposeCheck: ', checkId);
                    }
                };
            }
            function loadSidebarIntoIFrame() {
                var sidebarBaseUrl;
                if (config.sidebarUrl !== undefined) {
                    sidebarBaseUrl = config.sidebarUrl;
                }
                else {
                    sidebarBaseUrl = 'https://acrolinx-sidebar-classic.s3.amazonaws.com/v14/prod/';
                }
                return acrolinxLibs.$.ajax({
                    url: sidebarBaseUrl + 'index.html'
                }).then(function (sidebarHtml) {
                    var sidebarHtmlWithAbsoluteLinks = sidebarHtml
                        .replace(/src="/g, 'src="' + sidebarBaseUrl)
                        .replace(/href="/g, 'href="' + sidebarBaseUrl);
                    sidebarContentWindow.document.open();
                    sidebarContentWindow.document.write(sidebarHtmlWithAbsoluteLinks);
                    sidebarContentWindow.document.close();
                    onSidebarLoaded();
                });
            }
            loadSidebarIntoIFrame();
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
    })(plugins = acrolinx.plugins || (acrolinx.plugins = {}));
})(acrolinx || (acrolinx = {}));
//# sourceMappingURL=acrolinx-sidebar-integration.js.map