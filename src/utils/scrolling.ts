namespace acrolinx.plugins.utils {

  function getRootElement(doc: Document): HTMLElement {
    return (doc.documentElement || doc.body.parentNode || doc.body) as HTMLElement;
  }

  function getScrollTop(win = window) {
    return (win.pageYOffset !== undefined) ? win.pageYOffset : getRootElement(win.document).scrollTop;
  }

  function hasScrollBar(el: Element) {
    return el.clientHeight !== el.scrollHeight && el.tagName !== 'BODY' && el.tagName !== 'HTML';
  }

  function findAncestors(startEl: Element): Element[] {
    const result: Element[] = [];
    let currentEl = startEl.parentElement;
    while (currentEl) {
      result.push(currentEl);
      currentEl = currentEl.parentElement;
    }
    return result;
  }

  function findScrollableAncestors(startEl: Element): Element[] {
    return findAncestors(startEl).filter(hasScrollBar);
  }

  export function scrollIntoView(targetEl: HTMLElement, windowTopOffset = 0, localTopOffset = 0) {
    if (!windowTopOffset) {
      targetEl.scrollIntoView();
      return;
    }

    const pos = targetEl.getBoundingClientRect();

    const scrollableAncestors = findScrollableAncestors(targetEl);

    if (scrollableAncestors.length <= 2) {
      scrollableAncestors.forEach(scrollableOuterContainer => {
        const containerPos = scrollableOuterContainer.getBoundingClientRect();
        if (pos.top < containerPos.top + localTopOffset || pos.bottom > containerPos.bottom) {
          scrollableOuterContainer.scrollTop = pos.top - containerPos.top - localTopOffset;
        }
      });
    }

    const scrollTop = getScrollTop();
    if (pos.top < windowTopOffset || pos.bottom > window.innerHeight) {
      window.scrollTo(0, scrollTop + pos.top - windowTopOffset);
    }
  }

}