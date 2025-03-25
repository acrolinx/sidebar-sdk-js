import { describe, expect, it } from 'vitest';
import { deepCloneWithHTMLElement } from '../../src/utils/utils';

describe('deepCloneWithHTMLElement', () => {
  it('should clone primitive values', () => {
    expect(deepCloneWithHTMLElement(5)).toBe(5);
    expect(deepCloneWithHTMLElement('test')).toBe('test');
    expect(deepCloneWithHTMLElement(true)).toBe(true);
    expect(deepCloneWithHTMLElement(null)).toBe(null);
    expect(deepCloneWithHTMLElement(undefined)).toBe(undefined);
  });

  it('should clone arrays', () => {
    const originalArray = [1, 'test', { nested: true }];
    const clonedArray = deepCloneWithHTMLElement(originalArray);
    expect(clonedArray).toEqual(originalArray);
    expect(clonedArray).not.toBe(originalArray);
  });

  it('should clone objects', () => {
    const originalObject = {
      name: 'Example',
      data: { nested: [1, 2, 3] },
    };
    const clonedObject = deepCloneWithHTMLElement(originalObject);
    expect(clonedObject).toEqual(originalObject);
    expect(clonedObject).not.toBe(originalObject);
  });

  it('should clone HTML elements', () => {
    const originalElement = document.createElement('div');
    originalElement.textContent = 'Hello, world!';
    originalElement.setAttribute('data-test', 'test-value');

    const clonedElement = deepCloneWithHTMLElement(originalElement);
    expect(clonedElement).toBeInstanceOf(HTMLElement);
    expect(clonedElement.innerHTML).toBe(originalElement.innerHTML);
    expect(clonedElement.getAttribute('data-test')).toBe(originalElement.getAttribute('data-test'));
    expect(clonedElement).not.toBe(originalElement);
  });

  it('should clone objects with HTML elements', () => {
    const originalElement = document.createElement('div');
    originalElement.textContent = 'Hello, world!';

    const originalObject = {
      name: 'Example',
      element: originalElement,
      data: { nested: [1, 2, 3] },
    };

    const clonedObject = deepCloneWithHTMLElement(originalObject);
    expect(clonedObject.element).toBeInstanceOf(HTMLElement);
    expect(clonedObject.element.innerHTML).toBe(originalObject.element.innerHTML);
    expect(clonedObject.element).not.toBe(originalObject.element);
    expect(clonedObject.data).toEqual(originalObject.data);
    expect(clonedObject).toEqual(originalObject);
    expect(clonedObject).not.toBe(originalObject);
  });

  it('should handle functions within objects', () => {
    const originalObject = {
      name: 'test',
      func: function () {
        return 'hello';
      },
    };
    const clonedObject = deepCloneWithHTMLElement(originalObject);
    expect(clonedObject.name).toBe(originalObject.name);
    expect(clonedObject.func()).toBe('hello');
  });

  it('should handle dates within objects', () => {
    const originalObject = {
      date: new Date('2023-10-26T10:00:00.000Z'),
    };
    const clonedObject = deepCloneWithHTMLElement(originalObject);
    expect(clonedObject.date).toEqual(originalObject.date);
    expect(clonedObject.date).not.toBe(originalObject.date);
  });
});
