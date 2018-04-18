import {removeEmptyTextNodes} from '../../src/adapters/AbstractRichtextEditorAdapter';
import {isChrome} from '../../src/utils/detect-browser';
import {removeNode} from '../../src/utils/utils';
import {
  appendChildren,
  containsEmptyTextNodes,
  createDiv,
  createRange,
  createTextNode,
  describeIf
} from '../utils/test-utils';

const assert = chai.assert;

// https://bugs.chromium.org/p/chromium/issues/detail?id=811630
describeIf(isChrome(), 'empty text node chrome bug', () => {
  let testContainer: HTMLElement;

  beforeEach(() => {
    testContainer = createDiv([]);
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    removeNode(testContainer);
  });

  describe('removeEmptyTextNodes', () => {
    it('removes direct empty child nodes', () => {
      appendChildren(testContainer, [createTextNode('0'), createTextNode(''), createTextNode(' '), createTextNode('3')]);
      assert.isOk(containsEmptyTextNodes(testContainer));

      removeEmptyTextNodes(createRange(testContainer.childNodes[0], testContainer.childNodes[3]));

      assert.isFalse(containsEmptyTextNodes(testContainer));
      assert.equal(testContainer.innerHTML, '0 3');
    });

    it('removes empty child nodes recursively', () => {
      appendChildren(testContainer, [
        createTextNode(''),
        createTextNode('0'),
        createTextNode(''),
        createDiv([
          createTextNode(''),
          createTextNode('1.0'),
          createTextNode(''),
          createTextNode(' '),
          createTextNode(''),
          createTextNode('1.2'),
          createTextNode('')
        ]),
        createTextNode(''),
        createTextNode('2'),
        createTextNode(''),
      ]);
      assert.isOk(containsEmptyTextNodes(testContainer));

      removeEmptyTextNodes(createRange(testContainer, testContainer));

      assert.isFalse(containsEmptyTextNodes(testContainer));
      assert.equal(testContainer.innerHTML, '0<div>1.0 1.2</div>2');
    });
  });
});

describe('chrome bug affects only chrome', () => {
  let testContainer: HTMLElement;

  beforeEach(() => {
    testContainer = createDiv([]);
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    removeNode(testContainer);
  });

  // This test should fail as soon the bug in chrome is fixed.
  it('verify that the chrome bug still exist, but only in chrome', () => {
    testContainer.style.cssFloat = 'left'; // set float = left, to measure width

    appendChildren(testContainer, [createTextNode('0'), createTextNode(' '), createTextNode('4')]);
    const divWithoutBugHtml = testContainer.innerHTML;
    const divWithoutBugWidth = testContainer.getBoundingClientRect().width;

    testContainer.innerHTML = '';
    appendChildren(testContainer, [createTextNode('0'), createTextNode(''), createTextNode(' '), createTextNode('4')]);
    const divWithBugHtml = testContainer.innerHTML;
    const divWithBugWidth = testContainer.getBoundingClientRect().width;

    // Both divs should have the same content.
    assert.equal(divWithBugHtml, divWithoutBugHtml);

    // Normally both divs should render in same way and have the same width.
    if (isChrome()) {
      assert.isFalse(divWithBugWidth === divWithoutBugWidth);
    } else {
      assert.isTrue(divWithBugWidth === divWithoutBugWidth);
    }
  });

});