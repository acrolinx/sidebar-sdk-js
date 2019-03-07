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

import {MatchWithReplacement} from '../../src/acrolinx-libs/plugin-interfaces';
import * as _ from 'lodash';

const assert = chai.assert;

export function getDummySidebarPath() {
  return _.startsWith(location.pathname, '/test/') ? '/test/dummy-sidebar/' : '/base/test/dummy-sidebar/';
}

export function getMatchesWithReplacement(completeString: string, partialString: string, replacement = ''): MatchWithReplacement[] {
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
      range: [offsetStart, offsetEnd]
    });
  }
  return matches;
}

export function assertDeepEqual<T>(val: T, expected: T) {
  assert.equal(JSON.stringify(val), JSON.stringify(expected));
}

export function containsEmptyTextNodes(node: Node) {
  const nodeIterator = document.createNodeIterator(node, NodeFilter.SHOW_TEXT);
  let currentNode: Node | null;
  while (currentNode = nodeIterator.nextNode()) {
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
  children.forEach(node => div.appendChild(node));
  appendChildren(div, children);
  return div;
}

export function appendChildren(parent: Node, children: Node[]) {
  children.forEach(node => parent.appendChild(node));
}

export function createRange(startNode: Node, endNode: Node) {
  const range = new Range();
  range.setStart(startNode, 0);
  range.setEndAfter(endNode);
  return range;
}

export function describeIf(condition: boolean | string | undefined, testName: string, f: () => void) {
  if (condition) {
    describe(testName, f as any);
  } else {
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

export function testIfWindowIsFocused(testName: string, test: (done: () => void) => void) {
  testIf(document.hasFocus(), testName, test);
}

export function waitMs(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
