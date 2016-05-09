namespace acrolinx.plugins.autobind {
  'use strict';

  import List = _.List;
  import isIFrame = acrolinx.plugins.utils.isIFrame;
  import InputAdapter = acrolinx.plugins.adapter.InputAdapter;
  import ContentEditableAdapter = acrolinx.plugins.adapter.ContentEditableAdapter;
  import AdapterInterface = acrolinx.plugins.adapter.AdapterInterface;

  const EDITABLE_ELEMENTS_SELECTOR = [
    'input:not([type])', // type attribute not present in markup
    'input[type=""]', // type attribute present, but empty
    'input[type=text]',
    '[contenteditable="true"]',
    '[contenteditable="plaintext-only"]',
    'textarea',
    'iframe'
  ].join(', ');


  function isVisible(el: HTMLElement) {
    return el.offsetHeight > 0 && el.offsetWidth > 0;
  }


  function getEditableElements(doc: Document = document): HTMLElement[] {
    const visibleElements: HTMLElement[] = _.filter((doc.querySelectorAll(EDITABLE_ELEMENTS_SELECTOR) as any) as List<HTMLElement>, isVisible);
    return _.flatMap(visibleElements, (el: HTMLElement) => {
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
    });
  }


  export function bindAdaptersForCurrentPage(): AdapterInterface[] {
    return getEditableElements().map(function (editable) {
      if (editable.nodeName === 'INPUT' || editable.nodeName === 'TEXTAREA') {
        return new InputAdapter({element: editable});
      } else {
        return new ContentEditableAdapter({element: editable});
      }
    });
  }

}