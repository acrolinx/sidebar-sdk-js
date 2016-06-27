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

/// <reference path="../utils/alignment.ts" />
/// <reference path="../utils/escaping.ts" />

namespace acrolinx.plugins.adapter {
  'use strict';

  import MatchWithReplacement = acrolinx.sidebar.MatchWithReplacement;
  import Match = acrolinx.sidebar.Match;
  import CheckResult = acrolinx.sidebar.CheckResult;
  import Check = acrolinx.sidebar.Check;
  import escapeHtmlCharacters = acrolinx.plugins.utils.escapeHtmlCharacters;
  import EscapeHtmlCharactersResult = acrolinx.plugins.utils.EscapeHtmlCharactersResult;
  import findNewIndex = acrolinx.plugins.utils.findNewIndex;

  import _ = acrolinxLibs._;


  interface RemappedMatches<T extends Match> {
    matches: T[];
    adapter: AdapterInterface;
  }

  type AttributeMap =  {[key: string]: any};

  export interface WrapperConfOptions {
    tagName?: string;
    attributes?: AttributeMap;
  }

  export type AddSingleAdapterOptions = WrapperConfOptions;

  interface WrapperConf extends WrapperConfOptions {
    tagName: string;
    attributes: AttributeMap;
  }

  interface RegisteredAdapter {
    id: string;
    adapter: AdapterInterface;
    wrapper: WrapperConf;
    start?: number;
    end?: number;
    escapeResult?: EscapeHtmlCharactersResult;
  }


  function createStartTag(wrapper: WrapperConf, id?: string) {
    const allAttributes = _.clone(wrapper.attributes);
    if (id) {
      _.assign(allAttributes, {id});
    }
    const allAttributesString = _.map(allAttributes, (value, key) => ` ${key}="${_.escape(value)}"`).join('');
    return `<${wrapper.tagName}${allAttributesString}>`;
  }

  function createEndTag(tagName: string) {
    return `</${tagName}>`;
  }

  function mapBackRangeOfEscapedText(escapeResult: EscapeHtmlCharactersResult, range: [number, number]): [number, number] {
    return [
      findNewIndex(escapeResult.backwardAlignment, range[0]),
      findNewIndex(escapeResult.backwardAlignment, range[1])
    ];
  }

  export interface MultiEditorAdapterConfig {
    documentHeader?: string;
    rootElement?: WrapperConfOptions;
  }

  function wrapperConfWithDefaults(opts: WrapperConfOptions, defaultTagName = 'div') {
    const tagName = opts.tagName || defaultTagName;
    if (_.includes(tagName, ' ')) {
      console.info(`tagName "${tagName}" contains whitespaces which may lead to unexpected results.`);
    }
    return {tagName, attributes: opts.attributes || {}};
  }

  export class MultiEditorAdapter implements AdapterInterface {
    config: MultiEditorAdapterConfig;
    rootElementWrapper: WrapperConf; // Optional class properties will come with ts 2.0
    adapters: RegisteredAdapter[];
    checkResult: CheckResult;
    rootElement: string;

    constructor(config: MultiEditorAdapterConfig = {}) {
      this.config = config;
      if (config.rootElement) {
        this.rootElementWrapper = wrapperConfWithDefaults(config.rootElement, 'html');
      }
      this.adapters = [];
    }

    addSingleAdapter(singleAdapter: AdapterInterface, opts: AddSingleAdapterOptions = {}, id = 'acrolinx_integration' + this.adapters.length) {
      this.adapters.push({id: id, adapter: singleAdapter, wrapper: wrapperConfWithDefaults(opts)});
    }

    extractContentForCheck() {
      const Q = acrolinxLibs.Q;
      const deferred = Q.defer();
      const contentExtractionResults = this.adapters.map(adapter => adapter.adapter.extractContentForCheck());
      Q.all(contentExtractionResults).then((results: ContentExtractionResult[]) => {
        let html = this.config.documentHeader || '';
        if (this.rootElementWrapper) {
          html += createStartTag(this.rootElementWrapper);
        }
        for (let i = 0; i < this.adapters.length; i++) {
          const el = this.adapters[i];
          const tagName = el.wrapper.tagName;
          const startText = createStartTag(el.wrapper, el.id);
          const isText = el.adapter.getFormat ? el.adapter.getFormat() === 'TEXT' : false;
          const adapterContent = results[i].content;

          let elHtml: string;
          if (isText) {
            el.escapeResult = escapeHtmlCharacters(adapterContent);
            elHtml = el.escapeResult.escapedText;
          } else {
            elHtml = adapterContent;
          }

          const newTag = startText + elHtml + createEndTag(tagName);
          el.start = html.length + startText.length;
          el.end = html.length + startText.length + elHtml.length;
          html += newTag;
        }
        if (this.rootElementWrapper) {
          html += createEndTag(this.rootElementWrapper.tagName);
        }
        const contentExtractionResult: ContentExtractionResult = {content: html};
        deferred.resolve(contentExtractionResult);
      });
      return deferred.promise;
    }

    registerCheckCall(checkInfo: Check) {
    }

    registerCheckResult(checkResult: CheckResult): void {
      this.checkResult = checkResult;
      this.adapters.forEach(entry => {
        entry.adapter.registerCheckResult(checkResult);
      });
    }

    selectRanges(checkId: string, matches: Match[]) {
      const map = this.remapMatches(matches);
      for (let id in map) {
        map[id].adapter.selectRanges(checkId, map[id].matches);
      }
    }

    remapMatches<T extends Match>(matches: T[]) {
      const map: {[id: string]: RemappedMatches<T> } = {};
      for (const match of matches) {
        const registeredAdapter = this.getAdapterForMatch(match);
        if (!map.hasOwnProperty(registeredAdapter.id)) {
          map[registeredAdapter.id] = {matches: [], adapter: registeredAdapter.adapter};
        }
        const remappedMatch = _.clone(match);
        const rangeInsideWrapper: [number, number] = [match.range[0] - registeredAdapter.start, match.range[1] - registeredAdapter.start];
        remappedMatch.range = registeredAdapter.escapeResult ?
          mapBackRangeOfEscapedText(registeredAdapter.escapeResult, rangeInsideWrapper) : rangeInsideWrapper;
        map[registeredAdapter.id].matches.push(remappedMatch);
      }
      return map;
    }

    getAdapterForMatch(match: Match): RegisteredAdapter {
      return _.find(this.adapters,
        (adapter: RegisteredAdapter) => (match.range[0] >= adapter.start) && (match.range[1] <= adapter.end));
    }

    replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
      const map = this.remapMatches(matchesWithReplacement);
      for (let id in map) {
        map[id].adapter.replaceRanges(checkId, map[id].matches);
      }
    }

  }
}