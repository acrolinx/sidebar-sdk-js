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
  // Detect if ScrollIntoViewOptions are supported.
  // Should be supported currently (April 2019) in chrome and firefox.
  if (('scrollBehavior' in document.body.style)) {
    try {
      // For Chrome and Firefox (currently).
      targetEl.scrollIntoView({block: 'center'});
      return;
    } catch (e) {
      // According to https://stackoverflow.com/questions/46919627/is-it-possible-to-test-for-scrollintoview-browser-compatibility
      // it might still fail in strange browsers like "WaterFox".
    }
  }

  // Here begins a dubious workaround for not-so-modern browsers.

  targetEl.scrollIntoView();

  if (!windowTopOffset) {
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
