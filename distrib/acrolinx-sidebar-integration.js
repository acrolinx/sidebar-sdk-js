var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
        var lookup;
        (function (lookup) {
            var diffbased;
            (function (diffbased) {
                'use strict';
                var _ = acrolinxLibs._;
                var log = acrolinx.plugins.utils.log;
                var dmp = new diff_match_patch();
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
                function findNewOffset(offsetMappingArray, oldOffset) {
                    if (offsetMappingArray.length === 0) {
                        return 0;
                    }
                    var index = _.sortedIndexBy(offsetMappingArray, { diffOffset: 0, oldPosition: oldOffset + 0.1 }, function (offsetAlign) { return offsetAlign.oldPosition; });
                    return index > 0 ? offsetMappingArray[index - 1].diffOffset : 0;
                }
                diffbased.findNewOffset = findNewOffset;
                function hasModifiedWordBorders(offsetMappingArray, oldOffsetWord) {
                    return false;
                }
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
                        var beginAfterCleaning = match.range[0] + findNewOffset(cleaningOffsetMappingArray, match.range[0]);
                        var endAfterCleaning = match.range[1] + findNewOffset(cleaningOffsetMappingArray, match.range[1]);
                        var alignedBegin = beginAfterCleaning + findNewOffset(offsetMappingArray, beginAfterCleaning);
                        var lastCharacterPos = endAfterCleaning - 1;
                        var alignedEnd = lastCharacterPos + findNewOffset(offsetMappingArray, lastCharacterPos) + 1;
                        var hasModifiedBorders = hasModifiedWordBorders(offsetMappingArray, match.range[0]) || hasModifiedWordBorders(offsetMappingArray, match.range[1]);
                        return {
                            originalMatch: match,
                            range: [alignedBegin, alignedEnd],
                            hasModifiedWordBorders: hasModifiedBorders
                        };
                    });
                    var containsModifiedMatches = _.some(alignedMatches, function (m) {
                        return rangeContent(currentDocument, m) !== m.originalMatch.content || m.hasModifiedWordBorders;
                    });
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
            var AbstractRichtextEditorAdapter = (function () {
                function AbstractRichtextEditorAdapter(conf) {
                    this.editorId = conf.editorId;
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
                AbstractRichtextEditorAdapter.prototype.extractHTMLForCheck = function () {
                    this.html = this.getHTML();
                    this.currentHtmlChecking = this.html;
                    return { html: this.html };
                };
                AbstractRichtextEditorAdapter.prototype.scrollIntoView = function (sel) {
                    var range = sel.getRangeAt(0);
                    var tmp = range.cloneRange();
                    tmp.collapse(false);
                    var text = document.createElement('span');
                    tmp.insertNode(text);
                    text.scrollIntoView();
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
            'use strict';
            var CKEditorAdapter = (function (_super) {
                __extends(CKEditorAdapter, _super);
                function CKEditorAdapter() {
                    _super.apply(this, arguments);
                }
                CKEditorAdapter.prototype.getEditor = function () {
                    return CKEDITOR.instances[this.editorId];
                };
                CKEditorAdapter.prototype.getEditorDocument = function () {
                    return this.getEditor().document.$;
                };
                CKEditorAdapter.prototype.getHTML = function () {
                    return this.getEditor().getData();
                };
                CKEditorAdapter.prototype.extractHTMLForCheck = function () {
                    this.html = this.getHTML();
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
                    return { html: this.html };
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
        var adapter;
        (function (adapter) {
            'use strict';
            var ContentEditableAdapter = (function (_super) {
                __extends(ContentEditableAdapter, _super);
                function ContentEditableAdapter(conf) {
                    _super.call(this, conf);
                    this.element = document.getElementById(conf.editorId);
                }
                ContentEditableAdapter.prototype.getEditorElement = function () {
                    return this.element;
                };
                ContentEditableAdapter.prototype.getHTML = function () {
                    return this.element.innerHTML;
                };
                ContentEditableAdapter.prototype.getEditorDocument = function () {
                    return this.element.ownerDocument;
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
            var InputAdapter = (function () {
                function InputAdapter(elementOrConf) {
                    if (elementOrConf instanceof Element) {
                        this.element = elementOrConf;
                    }
                    else {
                        var conf = elementOrConf;
                        this.element = document.getElementById(conf.editorId);
                    }
                }
                InputAdapter.prototype.getHTML = function () {
                    return this.element.value;
                };
                InputAdapter.prototype.getCurrentText = function () {
                    return this.getHTML();
                };
                InputAdapter.prototype.getFormat = function () {
                    return 'TEXT';
                };
                InputAdapter.prototype.extractHTMLForCheck = function () {
                    this.html = this.getHTML();
                    this.currentHtmlChecking = this.html;
                    return { html: this.html };
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
                        el.blur();
                        el.value = text.slice(0, newBegin);
                        el.focus();
                        el.value = text;
                    }
                    el.setSelectionRange(newBegin, newBegin + matchLength);
                    el.scrollIntoView();
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
            var _ = acrolinxLibs._;
            var MultiEditorAdapter = (function () {
                function MultiEditorAdapter(conf) {
                    this.config = conf;
                    this.adapters = [];
                }
                MultiEditorAdapter.prototype.addSingleAdapter = function (singleAdapter, wrapper, id) {
                    if (wrapper === void 0) { wrapper = 'div'; }
                    if (id === void 0) { id = 'acrolinx_integration' + this.adapters.length; }
                    this.adapters.push({ id: id, adapter: singleAdapter, wrapper: wrapper });
                };
                MultiEditorAdapter.prototype.getWrapperTag = function (wrapper) {
                    return wrapper.split(' ')[0];
                };
                MultiEditorAdapter.prototype.extractHTMLForCheck = function () {
                    var _this = this;
                    var Q = acrolinxLibs.Q;
                    var deferred = Q.defer();
                    var htmlResults = this.adapters.map(function (adapter) { return adapter.adapter.extractHTMLForCheck(); });
                    Q.all(htmlResults).then(function (results) {
                        var html = '';
                        for (var i = 0; i < _this.adapters.length; i++) {
                            var el = _this.adapters[i];
                            var tag = _this.getWrapperTag(el.wrapper);
                            var startText = '<' + el.wrapper + ' id="' + el.id + '">';
                            var elHtml = results[i].html;
                            var newTag = startText + elHtml + '</' + tag + '>';
                            el.start = html.length + startText.length;
                            el.end = html.length + startText.length + elHtml.length;
                            html += newTag;
                        }
                        deferred.resolve({ html: html });
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
                        var adapter_2 = this.getAdapterForMatch(match);
                        if (!map.hasOwnProperty(adapter_2.id)) {
                            map[adapter_2.id] = { matches: [], adapter: adapter_2.adapter };
                        }
                        var remappedMatch = _.clone(match);
                        remappedMatch.range = [match.range[0] - adapter_2.start, match.range[1] - adapter_2.start];
                        map[adapter_2.id].matches.push(remappedMatch);
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
            var TinyMCEAdapter = (function (_super) {
                __extends(TinyMCEAdapter, _super);
                function TinyMCEAdapter() {
                    _super.apply(this, arguments);
                }
                TinyMCEAdapter.prototype.getEditor = function () {
                    return tinymce.get(this.editorId);
                };
                TinyMCEAdapter.prototype.getHTML = function () {
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
                TinyMCEWordpressAdapter.prototype.getHTML = function () {
                    return this.getEditor().getContent();
                };
                TinyMCEWordpressAdapter.prototype.getEditorDocument = function () {
                    return this.getEditor().getDoc();
                };
                TinyMCEWordpressAdapter.prototype.scrollToCurrentSelection = function () {
                    var editorBody = this.getEditor().getBody();
                    var parentWidth = this.getEditor().getContainer().clientWidth;
                    var bodyClientWidthWithMargin = editorBody.scrollWidth;
                    var hasVerticalScrollbar = parentWidth > bodyClientWidthWithMargin;
                    if (hasVerticalScrollbar) {
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
                    var text = document.createElement('span');
                    tmp.insertNode(text);
                    var ypos = text.getClientRects()[0].top;
                    window.scrollTo(0, ypos);
                    text.remove();
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
        'use strict';
        var _ = acrolinxLibs._;
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
            var sidebarIFrameElement = document.createElement('iframe');
            sidebarContainer.appendChild(sidebarIFrameElement);
            var sidebarContentWindow = sidebarIFrameElement.contentWindow;
            var adapter = editorAdapter;
            function onSidebarLoaded() {
                function initSidebarOnPremise() {
                    sidebarContentWindow.acrolinxSidebar.init(_.assign({}, {
                        showServerSelector: true,
                        clientComponents: clientComponents
                    }, config));
                }
                function requestGlobalCheckSync(html, format, documentReference) {
                    if (html.hasOwnProperty('error')) {
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
                }
                var acrolinxSidebarPlugin = {
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
                    requestGlobalCheck: function () {
                        console.log('requestGlobalCheck');
                        var pHtml = adapter.extractHTMLForCheck();
                        var pFormat = adapter.getFormat ? adapter.getFormat() : null;
                        var pDocumentReference = adapter.getDocumentReference ? adapter.getDocumentReference() : null;
                        if (isPromise(pHtml)) {
                            pHtml.then(function (html) {
                                requestGlobalCheckSync(html, pFormat, pDocumentReference);
                            });
                        }
                        else {
                            requestGlobalCheckSync(pHtml, pFormat, pDocumentReference);
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
                    download: function (download) {
                        console.log('download: ', download.url, download);
                        window.open(download.url);
                    },
                    openWindow: function (_a) {
                        var url = _a.url;
                        window.open(url);
                    }
                };
                console.log('Install acrolinxPlugin in sidebar.');
                sidebarContentWindow.acrolinxPlugin = acrolinxSidebarPlugin;
            }
            function loadSidebarIntoIFrame() {
                var sidebarBaseUrl = config.sidebarUrl || 'https://acrolinx-sidebar-classic.s3.amazonaws.com/v14/prod/';
                plugins.utils.fetch(sidebarBaseUrl + 'index.html', function (sidebarHtml) {
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