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
import {Check, CheckResult, Match, MatchWithReplacement} from "../acrolinx-libs/plugin-interfaces";
import {
  AdapterInterface,
  ContentExtractionResult,
  hasError,
  SuccessfulContentExtractionResult
} from "./AdapterInterface";
import * as _ from "lodash";
import {Promise} from "es6-promise";
import {EscapeHtmlCharactersResult, escapeHtmlCharacters} from "../utils/escaping";
import {findNewIndex} from "../utils/alignment";
import {containsText} from "../utils/utils";


export interface RemappedMatches<T extends Match> {
  matches: T[];
  adapter: AdapterInterface;
}

export type AttributeMap = { [key: string]: any };

export interface WrapperConfOptions {
  tagName?: string;
  attributes?: AttributeMap;
}

export type AddSingleAdapterOptions = WrapperConfOptions;

export interface WrapperConf extends WrapperConfOptions {
  tagName: string;
  attributes: AttributeMap;
}

export interface RegisteredAdapter {
  id: string;
  adapter: AdapterInterface;
  wrapper: WrapperConf;
  checkedRange?: [number, number];
  escapeResult?: EscapeHtmlCharactersResult;
}

export interface CheckedRegisteredAdapter extends RegisteredAdapter {
  checkedRange: [number, number];
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
  aggregateFormat?: 'AUTO' | 'HTML';
  documentHeader?: string;
  rootElement?: WrapperConfOptions;
  beforeCheck?: (multiAdapter: MultiEditorAdapter) => void;
}

function wrapperConfWithDefaults(opts: WrapperConfOptions, defaultTagName = 'div') {
  const tagName = opts.tagName || defaultTagName;
  if (_.includes(tagName, ' ')) {
    console.info(`tagName "${tagName}" contains whitespaces which may lead to unexpected results.`);
  }
  return {tagName, attributes: opts.attributes || {}};
}

function wrapAdapterContent(registeredAdapter: RegisteredAdapter, extractionResult: SuccessfulContentExtractionResult) {
  const adapterContent = extractionResult.content;
  const tagName = registeredAdapter.wrapper.tagName;
  const startText = createStartTag(registeredAdapter.wrapper, registeredAdapter.id);
  const isText = registeredAdapter.adapter.getFormat ? registeredAdapter.adapter.getFormat() === 'TEXT' : false;

  let innerHtml: string;
  if (isText) {
    registeredAdapter.escapeResult = escapeHtmlCharacters(adapterContent);
    innerHtml = registeredAdapter.escapeResult.escapedText;
  } else {
    innerHtml = adapterContent;
  }

  return {
    completeHtml: startText + innerHtml + createEndTag(tagName),
    contentStart: startText.length,
    contentEnd: startText.length + innerHtml.length
  };
}

export class MultiEditorAdapter implements AdapterInterface {
  private config: MultiEditorAdapterConfig;
  private rootElementWrapper?: WrapperConf;
  private adapters: RegisteredAdapter[];
  private checkResult: CheckResult;

  constructor(config: MultiEditorAdapterConfig = {}) {
    this.config = config;
    if (config.rootElement) {
      this.rootElementWrapper = wrapperConfWithDefaults(config.rootElement, 'html');
    }
    this.adapters = [];
  }

  getFormat() {
    return this.config.aggregateFormat || 'HTML';
  }

  addSingleAdapter(singleAdapter: AdapterInterface, opts: AddSingleAdapterOptions = {}, id = 'acrolinx_integration' + this.adapters.length) {
    this.adapters.push({id: id, adapter: singleAdapter, wrapper: wrapperConfWithDefaults(opts)});
  }

  removeAllAdapters() {
    this.adapters = [];
  }

  extractContentForCheck(): Promise<ContentExtractionResult> {
    if (this.config.beforeCheck) {
      this.config.beforeCheck(this);
    }
    return new Promise((resolve, _reject) => {
      const contentExtractionResults = this.adapters.map(adapter => adapter.adapter.extractContentForCheck());
      Promise.all(contentExtractionResults).then((results: ContentExtractionResult[]) => {
        let html = this.config.documentHeader || '';
        if (this.rootElementWrapper) {
          html += createStartTag(this.rootElementWrapper);
        }
        for (let i = 0; i < this.adapters.length; i++) {
          const extractionResult = results[i];
          const registeredAdapter = this.adapters[i];
          if (hasError(extractionResult) || !containsText(extractionResult.content)) {
            registeredAdapter.checkedRange = undefined;
            continue;
          }
          const {completeHtml, contentStart, contentEnd} = wrapAdapterContent(registeredAdapter, extractionResult);
          registeredAdapter.checkedRange = [html.length + contentStart, html.length + contentEnd];
          html += completeHtml;
        }
        if (this.rootElementWrapper) {
          html += createEndTag(this.rootElementWrapper.tagName);
        }
        const contentExtractionResult: ContentExtractionResult = {content: html};
        resolve(contentExtractionResult);
      });
    });
  }

  registerCheckCall(_checkInfo: Check) {
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
    const map: { [id: string]: RemappedMatches<T> } = {};
    for (const match of matches) {
      const registeredAdapter = this.getAdapterForMatch(match);
      if (!map.hasOwnProperty(registeredAdapter.id)) {
        map[registeredAdapter.id] = {matches: [], adapter: registeredAdapter.adapter};
      }
      const checkedRangeStart = registeredAdapter.checkedRange[0];
      const rangeInsideWrapper: [number, number] = [match.range[0] - (checkedRangeStart), match.range[1] - (checkedRangeStart)];
      const remappedMatch = _.clone(match);
      remappedMatch.range = registeredAdapter.escapeResult ?
        mapBackRangeOfEscapedText(registeredAdapter.escapeResult, rangeInsideWrapper) : rangeInsideWrapper;
      map[registeredAdapter.id].matches.push(remappedMatch);
    }
    return map;
  }

  getAdapterForMatch(match: Match): CheckedRegisteredAdapter {
    return _.find(this.adapters,
      (adapter: RegisteredAdapter) => {
        const checkedRange = adapter.checkedRange;
        return checkedRange && (match.range[0] >= checkedRange[0]) && (match.range[1] <= checkedRange[1]);
      }) as CheckedRegisteredAdapter;
  }

  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    const map = this.remapMatches(matchesWithReplacement);
    for (let id in map) {
      map[id].adapter.replaceRanges(checkId, map[id].matches);
    }
  }

}