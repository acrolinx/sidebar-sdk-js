function getRootElement(doc: Document): HTMLElement {
  return doc.documentElement || doc.body.parentNode || doc.body;
}

function getScrollTop(win = window) {
  return win.pageYOffset !== undefined ? win.pageYOffset : getRootElement(win.document).scrollTop;
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
  const success = scrollIntoViewCenteredIfPossible(targetEl);

  if (success) {
    return;
  }

  // Here begins a dubious workaround for not-so-modern browsers.

  targetEl.scrollIntoView();

  if (!windowTopOffset) {
    return;
  }

  const pos = targetEl.getBoundingClientRect();

  const scrollableAncestors = findScrollableAncestors(targetEl);

  if (scrollableAncestors.length <= 2) {
    scrollableAncestors.forEach((scrollableOuterContainer) => {
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

/**
 * @return indicates if it succeeded
 */
export function scrollIntoViewCenteredIfPossible(targetEl: HTMLElement): boolean {
  try {
    // For Chrome, Firefox and Safari (currently).
    // Try if scrollIntoViewOptions are supported.
    targetEl.scrollIntoView({ block: 'center' });
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // According to https://stackoverflow.com/questions/46919627/is-it-possible-to-test-for-scrollintoview-browser-compatibility
    // it might still fail in strange browsers like "WaterFox".
    return false;
  }
}

export function scrollIntoViewCenteredWithFallback(targetEl: HTMLElement) {
  const success = scrollIntoViewCenteredIfPossible(targetEl);

  if (!success) {
    targetEl.scrollIntoView(); // Fallback.
  }
}
