import * as _ from "lodash";
import {isIFrame, assign, isDisplayed} from "../utils/utils";
import {InputAdapter} from "../adapters/InputAdapter";
import {ContentEditableAdapter} from "../adapters/ContentEditableAdapter";
import {AdapterInterface, AdapterConf, CommonAdapterConf} from "../adapters/AdapterInterface";
import List = _.List;


const EDITABLE_ELEMENTS_SELECTOR = [
  'input:not([type])', // type attribute not present in markup
  'input[type=""]', // type attribute present, but empty
  'input[type=text]',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
  '[contenteditable]',
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
  const visibleElements: HTMLElement[] = _.filter((doc.querySelectorAll(EDITABLE_ELEMENTS_SELECTOR) as any) as List<HTMLElement>, isDisplayed) as HTMLElement[];
  return _(visibleElements).flatMap((el: HTMLElement) => {
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
