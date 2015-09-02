/**
 * Created by pricope on 9/1/2015.
 */
'use strict';

var MultiEditorAdapter = (function () {
  var cls = function (conf) {
    this.config = conf;
    this.adapters = [];

  };


  cls.prototype = {
    addSingleAdapter: function (singleAdapter, id) {
      this.adapters.push({id: id, adapter: singleAdapter});
    },

    extractHTMLForCheck: function () {

      var html = '';
      for (var i = 0; i < this.adapters.length; i++) {
        var el = this.adapters[i];
        var startText = '<div id="' + el.id + '">';
        var elHtml = el.adapter.extractHTMLForCheck().html;
        var newTag = startText + elHtml + '</div>';
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