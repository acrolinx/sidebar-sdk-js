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

import _ from "lodash";
import {AdapterConf, AdapterInterface, CommonAdapterConf} from "../adapters/AdapterInterface";
import {ContentEditableAdapter} from "../adapters/ContentEditableAdapter";
import {InputAdapter} from "../adapters/InputAdapter";
import {assign, isIFrame} from "../utils/utils";


const EDITABLE_ELEMENTS_SELECTOR = [
  'input:not([type])', // type attribute not present in markup
  'input[type=""]', // type attribute present, but empty
  'input[type=text]',
  'input[type=hidden]',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
  '[contenteditable=""]',
  'textarea',
  'iframe'
].join(', ');


function isReadOnly(el: HTMLElement) {
  return (el as HTMLInputElement).readOnly;
}

function isAutoCompleteOff(el: HTMLElement) {
  const autocomplete = el.getAttribute('autocomplete');
  return autocomplete === 'off' || autocomplete === 'false';
}

function isProbablyCombobox(el: HTMLElement) {
  const role = el.getAttribute('role');
  return role === 'combobox' && isAutoCompleteOff(el);
}

const PROBABLE_SEARCH_FIELD_NAMES = ['search_query', 'q'];
function isProbablySearchField(el: HTMLElement) {
  if (el.nodeName !== 'INPUT') {
    return false;
  }
  if (el.getAttribute('role') === 'search') {
    return true;
  }
  return _.includes(PROBABLE_SEARCH_FIELD_NAMES, el.getAttribute('name')) && isAutoCompleteOff(el);
}

function getEditableElements(doc: Document = document): HTMLElement[] {
  const editableElements: _.LoDashImplicitWrapper<ArrayLike<HTMLElement>> = _(doc.querySelectorAll(EDITABLE_ELEMENTS_SELECTOR));
  return editableElements.flatMap((el: HTMLElement) => {
    if (isIFrame(el)) {
      try {
        return el.contentDocument ? getEditableElements(el.contentDocument) : [];
      } catch (err) {
        // Caused by same origin policy problems.
        return [];
      }
    } else {
      return [el];
    }
  }).reject(el => isReadOnly(el) || isProbablyCombobox(el) || isProbablySearchField(el)).value();
}


export function bindAdaptersForCurrentPage(conf: CommonAdapterConf = {}): AdapterInterface[] {
  return getEditableElements().map(function (editable) {
    const adapterConf = assign(conf, {element: editable}) as AdapterConf;
    if (editable.nodeName === 'INPUT' || editable.nodeName === 'TEXTAREA') {
      return new InputAdapter(adapterConf);
    } else {
      return new ContentEditableAdapter(adapterConf);
    }
  });
}
