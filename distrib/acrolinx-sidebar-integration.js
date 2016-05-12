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
                        var beginAfterCleaning = findNewIndex(cleaningOffsetMappingArray, match.range[0]);
                        var endAfterCleaning = findNewIndex(cleaningOffsetMappingArray, match.range[1]);
                        var alignedBegin = findNewIndex(offsetMappingArray, beginAfterCleaning);
                        var lastCharacterPos = endAfterCleaning - 1;
                        var alignedEnd = findNewIndex(offsetMappingArray, lastCharacterPos) + 1;
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
            function isIFrame(el) {
                return el.nodeName === 'IFRAME';
            }
            utils.isIFrame = isIFrame;
            function fakeInputEvent(el) {
                el.dispatchEvent(new CustomEvent('input'));
            }
            utils.fakeInputEvent = fakeInputEvent;
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
            function isHasEditorID(a) {
                return !!a.editorId;
            }
            adapter.isHasEditorID = isHasEditorID;
            function getElementFromAdapterConf(conf) {
                if (isHasEditorID(conf)) {
                    return document.getElementById(conf.editorId);
                }
                else {
                    return conf.element;
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
            floatingSidebar.SIDEBAR_CONTAINER_ID = 'acrolinxSidebarContainer';
            var initialPos = {
                top: 100,
                left: 100
            };
            function addStyles() {
                var styleTag = document.createElement('style');
                var head = document.querySelector('head');
                styleTag.innerHTML = "\n      #acrolinxFloatingSidebar {\n        top: " + initialPos.top + "px;\n        left: " + initialPos.left + "px;\n        position: fixed;\n        width: 300px;\n        padding-top: 20px;\n        cursor: move;\n        background: #3e96db;\n        height: 500px;\n        box-shadow: 5px 5px 30px rgba(0, 0, 0, 0.3);\n        border-radius: 3px;\n        user-select: none;\n        z-index: 10000;\n      }\n  \n      #acrolinxFloatingSidebar #" + floatingSidebar.SIDEBAR_CONTAINER_ID + ",\n      #acrolinxFloatingSidebar #" + floatingSidebar.SIDEBAR_CONTAINER_ID + " iframe {\n        background: white;\n        height: 100%;\n        border: none;\n      }\n    ";
                head.appendChild(styleTag);
            }
            function initFloatingSidebar() {
                var floatingSidebarElement = document.createElement('div');
                floatingSidebarElement.id = 'acrolinxFloatingSidebar';
                var body = document.querySelector('body');
                var isDragging = false;
                var relativeMouseDownX = 0;
                var relativeMouseDownY = 0;
                function move(xpos, ypos) {
                    floatingSidebarElement.style.left = xpos + 'px';
                    floatingSidebarElement.style.top = ypos + 'px';
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
                });
                document.addEventListener('mouseup', function () {
                    isDragging = false;
                });
                floatingSidebarElement.innerHTML = "<div id=\"" + floatingSidebar.SIDEBAR_CONTAINER_ID + "\"></div>";
                addStyles();
                body.appendChild(floatingSidebarElement);
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
                if (config.useMessageAdapter) {
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