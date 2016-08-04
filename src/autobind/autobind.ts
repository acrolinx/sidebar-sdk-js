import {_} from "../acrolinx-libs/acrolinx-libs-defaults";
import List = _.List;
import {isIFrame, assign, isDisplayed} from "../utils/utils";
import {InputAdapter} from "../adapters/InputAdapter";
import {ContentEditableAdapter} from "../adapters/ContentEditableAdapter";
import {AdapterInterface, AdapterConf, CommonAdapterConf} from "../adapters/AdapterInterface";


const EDITABLE_ELEMENTS_SELECTOR = [
  'input:not([type])', // type attribute not present in markup
  'input[type=""]', // type attribute present, but empty
  'input[type=text]',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
  'textarea',
  'iframe'
].join(', ');


function isReadOnly(el: HTMLElement) {
  return (el as HTMLInputElement).readOnly;
}

function isProbablyCombobox(el: HTMLElement) {
  const role = el.attributes.getNamedItem('role');
  return role && role.value === 'combobox';
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
  }).reject(el => isReadOnly(el) || isProbablyCombobox(el)).value();
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
