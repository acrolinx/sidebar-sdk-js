/*
 *
 * * Copyright 2015 Acrolinx GmbH
 * *
 * * Licensed under the Apache License, Version 2.0 (the "License");
 * * you may not use this file except in compliance with the License.
 * * You may obtain a copy of the License at
 * *
 * * http://www.apache.org/licenses/LICENSE-2.0
 * *
 * * Unless required by applicable law or agreed to in writing, software
 * * distributed under the License is distributed on an "AS IS" BASIS,
 * * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * * See the License for the specific language governing permissions and
 * * limitations under the License.
 * *
 * * For more information visit: http://www.acrolinx.com
 *
 */
'use strict';


var MultiEditorAdapter = (function () {
  var cls = function (conf) {
    this.config = conf;
    this.adapters = [];

  };


  cls.prototype = {
    addSingleAdapter: function (singleAdapter, wrapper,id) {
      if (wrapper === undefined) {
        wrapper = 'div';
      }
      if (id === undefined) {
        id = 'acrolinx_integration' + this.adapters.length;
      }
      this.adapters.push({id: id, adapter: singleAdapter,wrapper:wrapper});
    },

    getWrapperTag: function (wrapper) {
      var tag = wrapper.split(" ")[0];
      return tag;
    },

    extractHTMLForCheck: function () {

      var html = '';
      for (var i = 0; i < this.adapters.length; i++) {
        var el = this.adapters[i];
        var tag = this.getWrapperTag(el.wrapper);
        var startText = '<' + el.wrapper +  ' id="' + el.id + '">';
        var elHtml = el.adapter.extractHTMLForCheck().html;
        var newTag = startText + elHtml + '</' + tag + '>';
        el.start = html.length + startText.length;
        el.end = html.length + startText.length + elHtml.length;
        html += newTag;

      }
      this.html = html;
      console.log(this.html);

      return {html: this.html};
    },

    registerCheckCall: function (checkInfo) {

    },


    registerCheckResult: function (checkResult) {
      this.checkResult = checkResult;
      this.adapters.forEach(function (entry) {
        entry.adapter.registerCheckResult(checkResult);
      });
      return [];
    },

    selectRanges: function (checkId, matches) {
      var map = this.remapMatches(matches);
      for (var id in map) {

        map[id].adapter.selectRanges(checkId, map[id].matches);
      }

    },

    remapMatches: function (matches) {

      var map = {};
      for (var i = 0; i < matches.length; i++) {
        var match = _.clone(matches[i]);
        match.range = _.clone(matches[i].range);
        var adapter = this.getAdapterForMatch(match);
        if (!map.hasOwnProperty(adapter.id)) {
          map[adapter.id] = {matches: [], adapter: adapter.adapter};
        }

        match.range[0] -= adapter.start;
        match.range[1] -= adapter.start;
        map[adapter.id].matches.push(match);

      }

      return map;
    },

    getAdapterForMatch: function (match) {
      for (var i = 0; i < this.adapters.length; i++) {
        var el = this.adapters[i];
        if ((match.range[0] >= el.start) && (match.range[1] <= el.end)) {
          return el;
        }
      }
      return null;

    },
    replaceRanges: function (checkId, matchesWithReplacement) {
      var map = this.remapMatches(matchesWithReplacement);
      for (var id in map) {

        map[id].adapter.replaceRanges(checkId, map[id].matches);
      }
    }


  };

  return cls;
})();