import { MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { describe, it } from 'vitest';

export function getDummySidebarPath() {
  return '/tests/browser/dummy-sidebar/';
}

export function getMatchesWithReplacement(
  completeString: string,
  partialString: string,
  replacement = '',
): MatchWithReplacement[] {
  const matches: MatchWithReplacement[] = [];
  let offsetStart: number;
  let offsetEnd = 0;

  while (true) {
    offsetStart = completeString.indexOf(partialString, offsetEnd);

    if (offsetStart == -1) {
      break;
    }

    offsetEnd = offsetStart + partialString.length;

    matches.push({
      content: partialString,
      replacement: replacement,
      range: [offsetStart, offsetEnd],
    });
  }
  return matches;
}

export function containsEmptyTextNodes(node: Node) {
  const nodeIterator = document.createNodeIterator(node, NodeFilter.SHOW_TEXT);
  let currentNode: Node | null;
  while ((currentNode = nodeIterator.nextNode())) {
    if (currentNode.textContent === '') {
      return true;
    }
  }
  return false;
}

export function createTextNode(text: string) {
  return document.createTextNode(text);
}

export function createDiv(children: Node[]) {
  const div = document.createElement('div');
  children.forEach((node) => div.appendChild(node));
  appendChildren(div, children);
  return div;
}

export function appendChildren(parent: Node, children: Node[]) {
  children.forEach((node) => parent.appendChild(node));
}

export function createRange(startNode: Node, endNode: Node) {
  const range = new Range();
  range.setStart(startNode, 0);
  range.setEndAfter(endNode);
  return range;
}

export function describeIf(condition: boolean | string | undefined, testName: string, f: () => void) {
  if (condition) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    describe(testName, f as any);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    describe.skip(testName, f as any);
  }
}

export function testIf(condition: boolean, testName: string, test: (done: () => void) => void) {
  if (condition) {
    it(testName, test);
  } else {
    it.skip(testName, test);
  }
}

export function isWindowFocused() {
  // navigator.webdriver indicated a headless chrome in which focus related stuff (like selection) works.
  return document.hasFocus() || navigator.webdriver;
}

export function testIfWindowIsFocused(testName: string, test: (done: () => void) => void) {
  testIf(isWindowFocused(), testName, test);
}

export function waitMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function addIFrame() {
  const iFrameElement = document.createElement('iframe');
  document.body.appendChild(iFrameElement);
  return iFrameElement;
}

export function removeEl(el: HTMLElement | undefined) {
  if (el) {
    el.parentNode!.removeChild(el);
  }
}

export interface BenchmarkResult {
  timeMsPerRun: number;
}

export function benchmark(runs: number, f: () => void): BenchmarkResult {
  const start = performance.now();
  for (let i = 0; i < runs; i++) {
    f();
  }
  return { timeMsPerRun: (performance.now() - start) / runs };
}

/**
 * Detect if ScrollIntoViewOptions are supported, which indicated that it's possible to scroll to center.
 * Should be supported currently (April 2019) in Chrome and Firefox.
 */
export function isScrollIntoViewCenteredAvailable(): boolean {
  return 'scrollBehavior' in document.body.style;
}
