/*
 * Copyright 2016-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Match,
  MatchWithReplacement,
  Check,
  DocumentSelection,
  CheckedDocumentPart, CheckInformationKeyValuePair
} from "../acrolinx-libs/plugin-interfaces";

export interface CommonAdapterConf {
  scrollOffsetY?: number;
}

export interface HasEditorID extends CommonAdapterConf {
  editorId: string;
}

export interface HasElement extends CommonAdapterConf {
  element: HTMLElement;
}

export type AdapterConf = HasEditorID | HasElement;

export interface HasError {
  error: any;
}

export interface SuccessfulContentExtractionResult {
  content: string;
  documentReference?: string;
  selection?: DocumentSelection;
}

export interface AutobindWrapperAttributes {
  'orginal-id'?: string;
  'orginal-class'?: string;
  'orginal-name'?: string;
  'orginal-source'?: string;
  [key: string]: string | undefined;
}

export type ContentExtractionResult = SuccessfulContentExtractionResult | HasError;

export interface ExtractContentForCheckOpts {
  checkSelection?: boolean;
}

export interface SuccessfulCheckResult {
  checkedPart: CheckedDocumentPart;
  embedCheckInformation?: CheckInformationKeyValuePair[];
  inputFormat?: string;
}

export interface CommonAdapterInterface {
  getFormat?(): string;
  getContent?(): string;
  extractContentForCheck(opts: ExtractContentForCheckOpts): ContentExtractionResult | Promise<ContentExtractionResult>;
  registerCheckCall(checkInfo: Check): void;
  registerCheckResult(checkResult: SuccessfulCheckResult): void;
  getAutobindWrapperAttributes?(): AutobindWrapperAttributes;
}

export interface AdapterInterface extends CommonAdapterInterface {
  selectRanges(checkId: string, matches: Match[]): void;
  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): void;
}

export interface AsyncAdapterInterface extends CommonAdapterInterface {
  readonly isAsync: true;
  readonly requiresSynchronization: boolean;
  selectRanges(checkId: string, matches: Match[]): Promise<void>;
  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): Promise<void>;
}

export function isAsyncAdapterInterface(a: AdapterInterface | AsyncAdapterInterface): a is AsyncAdapterInterface {
  return (a as AsyncAdapterInterface).isAsync;
}

export function hasError(a: ContentExtractionResult): a is HasError {
  return !!(a as HasError).error;
}

export function isSuccessfulContentExtractionResult(a: ContentExtractionResult): a is SuccessfulContentExtractionResult {
  return typeof (a as SuccessfulContentExtractionResult).content == 'string';
}

export function hasEditorID(a: AdapterConf): a is HasEditorID {
  return !!(a as HasEditorID).editorId;
}

export function hasElement(a: AdapterConf): a is HasElement {
  return !!(a as HasElement).element;
}

export function getElementFromAdapterConf(conf: AdapterConf) {
  if (hasElement(conf)) {
    return conf.element;
  } else if (hasEditorID(conf)) {
    return document.getElementById(conf.editorId) as HTMLElement;
  } else {
    console.error('Invalid AdapterConf. Missing editorId or element', conf);
    throw new Error('Invalid AdapterConf. Missing editorId or element');
  }
}


