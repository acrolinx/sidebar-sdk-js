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

import { AdapterConf, AdapterInterface, CommonAdapterConf } from '../adapters/AdapterInterface';
import { AsyncContentEditableAdapter, isStateBasedEditor } from '../adapters/AsyncContentEditableAdapter';
import { ContentEditableAdapter } from '../adapters/ContentEditableAdapter';
import { HerettoContentEditableAdapter, isHeretto } from '../adapters/HerettoContentEditableAdapter';
import { InputAdapter } from '../adapters/InputAdapter';
import { isQuip, QuipAdapter } from '../adapters/QuipAdapter';
import { assign, isIFrame } from '../utils/utils';

// Exported only for testing
export const EDITABLE_ELEMENTS_SELECTOR = [
  'input:not([type])', // type attribute not present in markup
  'input[type=""]', // type attribute present, but empty
  'input[type=text]',
  'input[type=hidden]',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
  '[contenteditable=""]',
  'textarea',
  'iframe',
].join(', ');

function isReadOnly(el: Element) {
  return (el as HTMLInputElement).readOnly;
}

function isAutoCompleteOff(el: Element) {
  const autocomplete = el.getAttribute('autocomplete');
  return autocomplete === 'off' || autocomplete === 'false';
}

function isProbablyCombobox(el: Element) {
  const role = el.getAttribute('role');
  return role === 'combobox' && isAutoCompleteOff(el);
}

const PROBABLE_SEARCH_FIELD_NAMES = ['search_query', 'q'];

function isProbablySearchField(el: Element) {
  if (el.nodeName !== 'INPUT') {
    return false;
  }
  if (el.getAttribute('role') === 'search') {
    return true;
  }
  const name = el.getAttribute('name');
  return name && PROBABLE_SEARCH_FIELD_NAMES.includes(name) && isAutoCompleteOff(el);
}

const UNDESIRED_FIELD_NAMES = ['username', 'login', 'user[login]', 'authenticity_token'];

export function isProbablyUndesiredField(el: Element) {
  return UNDESIRED_FIELD_NAMES.includes(el.getAttribute('name')!);
}

function traverseIFrames(el: Element): Element[] {
  if (isIFrame(el)) {
    try {
      return el.contentDocument ? getEditableElements(el.contentDocument) : [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Caused by same origin policy problems.
      return [];
    }
  } else {
    return [el];
  }
}

// Caused by open https://github.com/whatwg/dom/issues/665 we have to search manually.
function traverseShadowRoots(doc: Document | ShadowRoot | HTMLElement): Element[] {
  const editableElements = [];

  const nodesIterator = (doc.ownerDocument || doc).createNodeIterator(doc, NodeFilter.SHOW_ELEMENT);

  let currentNode;

  while ((currentNode = nodesIterator.nextNode())) {
    const shadowRoot = (currentNode as HTMLElement).shadowRoot;
    if (shadowRoot) {
      editableElements.push(...getEditableElements(shadowRoot));
    }
  }

  return editableElements;
}

// Exported mainly for testing
export function getEditableElements(doc: Document | ShadowRoot | HTMLElement = document): Element[] {
  const temp = Array.from(doc.querySelectorAll(EDITABLE_ELEMENTS_SELECTOR));
  const shadowRootElements = traverseShadowRoots(doc);
  const combined = [...temp, ...shadowRootElements];
  const iframedElements = combined.flatMap(traverseIFrames);
  const filteredElements = iframedElements.filter(
    (el) => !isReadOnly(el) && !isProbablyCombobox(el) && !isProbablySearchField(el) && !isProbablyUndesiredField(el),
  );
  return filteredElements;
}

export interface AutobindConfig extends CommonAdapterConf {
  enableQuipAdapter?: boolean;
  enableHerettoAdapter?: boolean;
}

export function bindAdaptersForCurrentPage(conf: AutobindConfig = {}): AdapterInterface[] {
  return getEditableElements().map(function (editable) {
    const adapterConf = assign(conf, { element: editable }) as AdapterConf;
    if (conf.enableHerettoAdapter && isHeretto(editable)) {
      return new HerettoContentEditableAdapter(adapterConf);
    } else if (conf.enableQuipAdapter && isQuip(editable)) {
      return new QuipAdapter(adapterConf);
    } else if (editable.nodeName === 'INPUT' || editable.nodeName === 'TEXTAREA') {
      console.log('InputAdapter', editable);
      return new InputAdapter(adapterConf);
    } else if (isStateBasedEditor(editable)) {
      return new AsyncContentEditableAdapter(adapterConf);
    } else {
      console.log('ContentEditableAdapter', editable);
      return new ContentEditableAdapter(adapterConf);
    }
  });
}
