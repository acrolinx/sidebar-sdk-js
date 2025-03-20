import _ from 'lodash';
import { AdapterConf, AdapterInterface, CommonAdapterConf } from '../adapters/adapter-interface';
import { AsyncContentEditableAdapter, isStateBasedEditor } from '../adapters/async-content-editable-adapter';
import { ContentEditableAdapter } from '../adapters/content-editable-adapter';
import { InputAdapter } from '../adapters/input-adapter';
import { isQuip, QuipAdapter } from '../adapters/quip-adapter';
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
  return _.includes(PROBABLE_SEARCH_FIELD_NAMES, el.getAttribute('name')) && isAutoCompleteOff(el);
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
  const temp = doc.querySelectorAll(EDITABLE_ELEMENTS_SELECTOR);
  const value = _(temp)
    .union(traverseShadowRoots(doc))
    .flatMap(traverseIFrames)
    .reject(
      (el) => isReadOnly(el) || isProbablyCombobox(el) || isProbablySearchField(el) || isProbablyUndesiredField(el),
    )
    .value();

  return value;
}

export interface AutobindConfig extends CommonAdapterConf {
  enableQuipAdapter?: boolean;
}

export function bindAdaptersForCurrentPage(conf: AutobindConfig = {}): AdapterInterface[] {
  return getEditableElements().map(function (editable) {
    const adapterConf = assign(conf, { element: editable }) as AdapterConf;
    if (conf.enableQuipAdapter && isQuip(editable)) {
      return new QuipAdapter(adapterConf);
    } else if (editable.nodeName === 'INPUT' || editable.nodeName === 'TEXTAREA') {
      return new InputAdapter(adapterConf);
    } else if (isStateBasedEditor(editable)) {
      return new AsyncContentEditableAdapter(adapterConf);
    } else {
      return new ContentEditableAdapter(adapterConf);
    }
  });
}
