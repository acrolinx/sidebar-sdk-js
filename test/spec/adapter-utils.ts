/*
 * Copyright 2020-present Acrolinx GmbH
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

import _ from 'lodash';
import { getAutobindWrapperAttributes } from '../../src/utils/adapter-utils';
import { assertDeepEqual } from '../utils/test-utils';

describe('escapeHtmlCharacters', () => {
  it('empty div', () => {
    const element = createElementWithAttributes('div', {});
    const result = getAutobindWrapperAttributes(element);
    assertDeepEqual(result, {
      'original-source': 'div',
      'original-display': 'hidden',
    });
  });

  it('all fixed attributes', () => {
    const element = createElementWithAttributes('input', {
      id: 'myId',
      name: 'myName',
      class: 'myClass',
    });
    const result = getAutobindWrapperAttributes(element);
    assertDeepEqual(result, {
      'original-id': 'myId',
      'original-source': 'input',
      'original-name': 'myName',
      'original-display': 'hidden',
      'original-class': 'myClass',
    });
  });

  describe('element is displayed', () => {
    let element: HTMLElement;
    beforeEach(() => {
      element = createElementWithAttributes('input', {});
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it('omit original-display attribute if displayed', () => {
      const result = getAutobindWrapperAttributes(element);
      assertDeepEqual(result, {
        'original-source': 'input',
      });
    });
  });

  it('all aria attributes', () => {
    const element = createElementWithAttributes('textarea', {
      'aria-label': 'myAriaLabel',
      'other-thing': 'otherThing',
    });
    const result = getAutobindWrapperAttributes(element);
    assertDeepEqual(result, {
      'original-source': 'textarea',
      'original-display': 'hidden',
      'original-aria-label': 'myAriaLabel',
    });
  });
});

function createElementWithAttributes(tag: string, attributes: { [key: string]: string }) {
  const element = document.createElement(tag, {});
  _.forEach(attributes, (value, key) => {
    element.setAttribute(key, value);
  });
  return element;
}
