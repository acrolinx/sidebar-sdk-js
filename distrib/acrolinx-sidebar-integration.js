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
        var lookup;
        (function (lookup) {
            var diffbased;
            (function (diffbased) {
                'use strict';
                var _ = acrolinxLibs._;
                var dmp = new diff_match_patch();
                var OffSetAlign = (function () {
                    function OffSetAlign() {
                    }
                    return OffSetAlign;
                }());
                function createOffsetMappingArray(diffs) {
                    var offsetMappingArray = [];
                    var offsetCountOld = 0;
                    var diff = 0;
                    diffs.forEach(function (_a) {
                        var action = _a[0], value = _a[1];
                        switch (action) {
                            case DIFF_EQUAL:
                                offsetCountOld += value.length;
                                break;
                            case DIFF_DELETE:
                                offsetCountOld += value.length;
                                diff -= value.length;
                                break;
                            case DIFF_INSERT:
                                diff += value.length;
                                break;
                            default:
                                throw new Error('Illegal Diff Action: ' + action);
                        }
                        offsetMappingArray.push({
                            oldPosition: offsetCountOld,
                            diffOffset: diff
                        });
                    });
                    return offsetMappingArray;
                }
                diffbased.createOffsetMappingArray = createOffsetMappingArray;
                function lookupMatches(checkedDocument, currentDocument, matches) {
                    if (_.isEmpty(matches)) {
                        return [];
                    }
                    var diffs = dmp.diff_main(checkedDocument, currentDocument);
                    var offsetMappingArray = createOffsetMappingArray(diffs);
                    function findNewOffset(oldOffset) {
                        var index = _.findIndex(offsetMappingArray, function (element) {
                            return element.oldPosition > oldOffset;
                        });
                        if (index > 0) {
                            return offsetMappingArray[index - 1].diffOffset;
                        }
                        else if (offsetMappingArray.length > 1 && index === -1) {
                            if (diffs[offsetMappingArray.length - 1][0] === DIFF_EQUAL) {
                                return offsetMappingArray[offsetMappingArray.length - 1].diffOffset;
                            }
                            return offsetMappingArray[offsetMappingArray.length - 2].diffOffset;
                        }
                        else if (index === 0) {
                            return offsetMappingArray[0].diffOffset;
                        }
                        else
                            return 0;
                    }
                    var result = matches.map(function (match) { return ({
                        replacement: match.replacement,
                        range: match.range,
                        content: match.content,
                        foundOffset: match.range[0] + findNewOffset(match.range[0]),
                        flagLength: match.range[1] - match.range[0],
                    }); });
                    result[0].flagLength = matches[matches.length - 1].range[1] - matches[0].range[0];
                    return result;
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
        var adapter;
        (function (adapter) {
            'use strict';
            var lookupMatchesStandard = acrolinx.plugins.lookup.diffbased.lookupMatches;
            var _ = acrolinxLibs._;
            function replaceRangeContent(range, replacementText) {
                range.deleteContents();
                if (replacementText) {
                    range.insertNode(range.createContextualFragment(replacementText));
                }
            }
            var CKEditorAdapter = (function () {
                function CKEditorAdapter(conf) {
                    this.lookupMatches = lookupMatchesStandard;
                    this.editorId = conf.editorId;
                    this.editor = null;
                    if (conf.lookupMatches) {
                        this.lookupMatches = conf.lookupMatches;
                    }
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
                    var editorDocument = this.getEditorDocument();
                    var range = rangy.createRange(editorDocument);
                    range.setStart(editorDocument, 0);
                    range.setEnd(editorDocument, 0);
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
                    matchLength = matches[0].flagLength;
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
                    var alignedMatches = this.lookupMatches(this.currentHtmlChecking, this.getCurrentText(), matches);
                    if (_.isEmpty(alignedMatches)) {
                        throw 'Selected flagged content is modified.';
                    }
                    this.scrollAndSelect(alignedMatches);
                    return alignedMatches;
                };
                CKEditorAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacementArg) {
                    var selectionFromCharPos = 1;
                    if (this.editor.mode === 'wysiwyg') {
                        try {
                            var alignedMatches = this.selectMatches(checkId, matchesWithReplacementArg);
                            this.selectMatches(checkId, alignedMatches);
                            var useWorkAround = alignedMatches[0].foundOffset + alignedMatches[0].flagLength - 1 < this.getCurrentText().length;
                            if (useWorkAround) {
                                alignedMatches[0].foundOffset += selectionFromCharPos;
                                alignedMatches[0].flagLength -= selectionFromCharPos;
                            }
                            var selectedRange = this.scrollAndSelect(alignedMatches);
                            var replacementText = _.map(alignedMatches, 'replacement').join('');
                            replaceRangeContent(selectedRange, replacementText);
                            if (useWorkAround) {
                                if (selectionFromCharPos > 0) {
                                    this.selectText(alignedMatches[0].foundOffset - selectionFromCharPos, selectionFromCharPos);
                                    rangy.getSelection(this.getEditorDocument()).nativeSelection.deleteFromDocument();
                                }
                                alignedMatches[0].foundOffset -= selectionFromCharPos;
                                alignedMatches[0].flagLength += selectionFromCharPos;
                            }
                            this.selectText(alignedMatches[0].foundOffset, replacementText.length);
                        }
                        catch (error) {
                            console.log(error);
                            return;
                        }
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
            var lookupMatchesStandard = acrolinx.plugins.lookup.diffbased.lookupMatches;
            var $ = acrolinxLibs.$;
            var _ = acrolinxLibs._;
            'use strict';
            var ContentEditableAdapter = (function () {
                function ContentEditableAdapter(conf) {
                    this.lookupMatches = lookupMatchesStandard;
                    this.config = conf;
                    this.element = document.getElementById(conf.editorId);
                    if (conf.lookupMatches) {
                        this.lookupMatches = conf.lookupMatches;
                    }
                }
                ContentEditableAdapter.prototype.registerCheckCall = function (checkInfo) {
                };
                ContentEditableAdapter.prototype.registerCheckResult = function (checkResult) {
                    return [];
                };
                ContentEditableAdapter.prototype.getHTML = function () {
                    return this.element.innerHTML;
                };
                ContentEditableAdapter.prototype.getEditorDocument = function () {
                    try {
                        return this.element.ownerDocument;
                    }
                    catch (error) {
                        throw error;
                    }
                };
                ContentEditableAdapter.prototype.getCurrentText = function () {
                    try {
                        return rangy.innerText(this.element);
                    }
                    catch (error) {
                        throw error;
                    }
                };
                ContentEditableAdapter.prototype.extractHTMLForCheck = function () {
                    this.html = this.getHTML();
                    this.currentHtmlChecking = this.html;
                    return { html: this.html };
                };
                ContentEditableAdapter.prototype.selectText = function (begin, length) {
                    var doc = this.getEditorDocument();
                    var selection = rangy.getSelection(doc);
                    var range = rangy.createRange(doc);
                    range.setStart(this.element, 0);
                    range.moveStart('character', begin);
                    range.moveEnd('character', length);
                    selection.setSingleRange(range);
                    return range;
                };
                ContentEditableAdapter.prototype.scrollIntoView2 = function (sel) {
                    var range = sel.getRangeAt(0);
                    var tmp = range.cloneRange();
                    tmp.collapse();
                    var text = document.createElement('span');
                    tmp.startContainer.parentNode.insertBefore(text, tmp.startContainer);
                    text.scrollIntoView();
                    text.remove();
                };
                ContentEditableAdapter.prototype.scrollAndSelect = function (matches) {
                    var newBegin, matchLength, selection1, selection2, range1, range2, doc;
                    newBegin = matches[0].foundOffset;
                    matchLength = matches[0].flagLength;
                    range1 = this.selectText(newBegin, matchLength);
                    selection1 = rangy.getSelection(this.getEditorDocument());
                    if (selection1) {
                        try {
                            this.scrollIntoView2(selection1);
                            var wpContainer = $('#wp-content-editor-container');
                            if (wpContainer.length > 0) {
                                window.scrollBy(0, -50);
                            }
                        }
                        catch (error) {
                            console.log("Scrolling Error!");
                        }
                    }
                    range2 = this.selectText(newBegin, matchLength);
                };
                ContentEditableAdapter.prototype.selectRanges = function (checkId, matches) {
                    this.selectMatches(checkId, matches);
                };
                ContentEditableAdapter.prototype.selectMatches = function (checkId, matches) {
                    var alignedMatches = this.lookupMatches(this.currentHtmlChecking, this.getCurrentText(), matches);
                    if (_.isEmpty(alignedMatches)) {
                        throw 'Selected flagged content is modified.';
                    }
                    this.scrollAndSelect(alignedMatches);
                    return alignedMatches;
                };
                ContentEditableAdapter.prototype.replaceSelection = function (content) {
                    var doc = this.getEditorDocument();
                    var selection = rangy.getSelection(doc);
                    var rng = selection.getRangeAt(0);
                    content += '<span id="__caret">_</span>';
                    rng.deleteContents();
                    var frag = rng.createContextualFragment(content);
                    rng.insertNode(frag);
                    var caretNode = doc.getElementById('__caret');
                    rng = rangy.createRange();
                    rng.setStartBefore(caretNode);
                    rng.setEndBefore(caretNode);
                    rangy.getSelection().setSingleRange(rng);
                    caretNode.parentNode.removeChild(caretNode);
                };
                ContentEditableAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    try {
                        var alignedMatches = this.selectMatches(checkId, matchesWithReplacement);
                        this.scrollAndSelect(alignedMatches);
                        var replacementText = _.map(alignedMatches, 'replacement').join('');
                        this.replaceSelection(replacementText);
                        this.selectText(alignedMatches[0].foundOffset, replacementText.length);
                    }
                    catch (error) {
                        console.log(error);
                        return;
                    }
                };
                return ContentEditableAdapter;
            }());
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
            var lookupMatchesStandard = acrolinx.plugins.lookup.diffbased.lookupMatches;
            var _ = acrolinxLibs._;
            var InputAdapter = (function () {
                function InputAdapter(elementOrConf) {
                    this.lookupMatches = lookupMatchesStandard;
                    if (elementOrConf instanceof Element) {
                        this.element = elementOrConf;
                    }
                    else {
                        var conf = elementOrConf;
                        this.element = document.getElementById(conf.editorId);
                        if (conf.lookupMatches) {
                            this.lookupMatches = conf.lookupMatches;
                        }
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
                    matchLength = matches[0].flagLength;
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
                    var alignedMatches = this.lookupMatches(this.currentHtmlChecking, this.getCurrentText(), matches);
                    if (_.isEmpty(alignedMatches)) {
                        throw 'Selected flagged content is modified.';
                    }
                    this.scrollAndSelect(alignedMatches);
                    return alignedMatches;
                };
                InputAdapter.prototype.replaceSelection = function (content) {
                    acrolinxLibs.$(this.element).replaceSelectedText(content, "select");
                };
                InputAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    try {
                        var alignedMatches = this.selectMatches(checkId, matchesWithReplacement);
                        this.scrollAndSelect(alignedMatches);
                        var replacementText = _.map(alignedMatches, 'replacement').join('');
                        this.replaceSelection(replacementText);
                    }
                    catch (error) {
                        console.log(error);
                        return;
                    }
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
            var lookupMatchesStandard = acrolinx.plugins.lookup.diffbased.lookupMatches;
            var _ = acrolinxLibs._;
            var TinyMCEAdapter = (function () {
                function TinyMCEAdapter(conf) {
                    this.lookupMatches = lookupMatchesStandard;
                    this.editorId = conf.editorId;
                    this.editor = null;
                    if (conf.lookupMatches) {
                        this.lookupMatches = conf.lookupMatches;
                    }
                }
                TinyMCEAdapter.prototype.getEditor = function () {
                    if (this.editor === null) {
                        this.editor = tinymce.get(this.editorId);
                    }
                    return this.editor;
                };
                TinyMCEAdapter.prototype.getHTML = function () {
                    return this.getEditor().getContent();
                };
                TinyMCEAdapter.prototype.getEditorDocument = function () {
                    try {
                        return this.getEditor().contentDocument;
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
                    matchLength = matches[0].flagLength;
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
                    var alignedMatches = this.lookupMatches(this.currentHtmlChecking, this.getCurrentText(), matches);
                    if (_.isEmpty(alignedMatches)) {
                        throw 'Selected flagged content is modified.';
                    }
                    this.scrollAndSelect(alignedMatches);
                    return alignedMatches;
                };
                TinyMCEAdapter.prototype.replaceRanges = function (checkId, matchesWithReplacement) {
                    var selectionFromCharPos = 1;
                    try {
                        var alignedMatches = this.selectMatches(checkId, matchesWithReplacement);
                        var useWorkAround = alignedMatches[0].foundOffset + alignedMatches[0].flagLength - 1 < this.getCurrentText().length;
                        if (useWorkAround) {
                            alignedMatches[0].foundOffset += selectionFromCharPos;
                            alignedMatches[0].flagLength -= selectionFromCharPos;
                        }
                        this.scrollAndSelect(alignedMatches);
                        var replacementText = _.map(alignedMatches, 'replacement').join('');
                        this.editor.selection.setContent(replacementText);
                        if (useWorkAround) {
                            if (selectionFromCharPos > 0) {
                                this.selectText(alignedMatches[0].foundOffset - selectionFromCharPos, selectionFromCharPos);
                                rangy.getSelection(this.getEditorDocument()).nativeSelection.deleteFromDocument();
                            }
                            alignedMatches[0].foundOffset -= selectionFromCharPos;
                            alignedMatches[0].flagLength += selectionFromCharPos;
                        }
                        this.selectText(alignedMatches[0].foundOffset, replacementText.length);
                    }
                    catch (error) {
                        console.log(error);
                        throw error;
                    }
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
        var lookup;
        (function (lookup) {
            var old;
            (function (old) {
                'use strict';
                var _ = acrolinxLibs._;
                function isFlagContainsOnlySpecialChar(flaggedContent) {
                    var pattern = /\w/g;
                    return !pattern.test(flaggedContent);
                }
                function getTextContent(html) {
                    var tmpHTMLElement = acrolinxLibs.$('<div/>').html(html);
                    return tmpHTMLElement.text().replace(/\t+/g, '');
                }
                function escapeRegExp(string) {
                    return string.replace(/([\".*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
                }
                function createSearchPattern(matches, currentHtmlChecking) {
                    var searchPattern = matches[0].textContent, wordBoundary = '\\b';
                    if (shouldApplyWordBoundary(matches, currentHtmlChecking) === true) {
                        searchPattern = wordBoundary + searchPattern + wordBoundary;
                    }
                    return searchPattern;
                }
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
                function isAlphaNumeral(character) {
                    if ((character.charCodeAt(0) >= 48 && character.charCodeAt(0) <= 90) ||
                        (character.charCodeAt(0) >= 97 && character.charCodeAt(0) <= 126)) {
                        return true;
                    }
                    return false;
                }
                function getFlagContents(begin, end, currentHtmlChecking) {
                    return currentHtmlChecking.substr(begin, end - begin);
                }
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
                function lookupMatches(checkedDocument, currentDocument, matches) {
                    var extendedMatches = addPropertiesToMatches(_.cloneDeep(matches), checkedDocument);
                    var currentFlagOffsets = findAllFlagOffsets(currentDocument, extendedMatches[0].searchPattern);
                    var index = findBestMatchOffset(currentFlagOffsets, extendedMatches);
                    var offset = currentFlagOffsets[index];
                    if (!(offset >= 0)) {
                        return [];
                    }
                    extendedMatches[0].foundOffset = offset;
                    if (extendedMatches[0].content.length >= extendedMatches[0].range[1] - extendedMatches[0].range[0]) {
                        extendedMatches[0].textContent = extendedMatches[0].textContent.replace(/\\/g, '');
                    }
                    else {
                        extendedMatches[0].textContent = extendedMatches[0].textContent.replace(/\\\\/g, '\\');
                    }
                    extendedMatches[0].flagLength = extendedMatches[0].textContent.length - 1;
                    console.log(JSON.stringify(extendedMatches));
                    return extendedMatches;
                }
                old.lookupMatches = lookupMatches;
            })(old = lookup.old || (lookup.old = {}));
        })(lookup = plugins.lookup || (plugins.lookup = {}));
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
            var _ = acrolinxLibs._;
            var $sidebarContainer = $('#' + config.sidebarContainerId);
            var $sidebar = $('<iframe></iframe>');
            $sidebarContainer.append($sidebar);
            var sidebarContentWindow = $sidebar.get(0).contentWindow;
            var adapter = editorAdapter;
            function onSidebarLoaded() {
                function initSidebarOnPremise() {
                    sidebarContentWindow.acrolinxSidebar.init(_.assign({}, {
                        showServerSelector: true,
                        clientComponents: clientComponents
                    }, config));
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