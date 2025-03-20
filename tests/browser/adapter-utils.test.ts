import _ from 'lodash';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { getAutobindWrapperAttributes } from '../../src/utils/adapter-utils';

describe('escapeHtmlCharacters', () => {
  it('empty div', () => {
    const element = createElementWithAttributes('div', {});
    const result = getAutobindWrapperAttributes(element);
    expect(result).toEqual({
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
    expect(result).toEqual({
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
      expect(result).toEqual({
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
    expect(result).toEqual({
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
