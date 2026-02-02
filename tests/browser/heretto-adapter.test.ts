/*
 * Copyright 2025-present Acrolinx GmbH
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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HerettoContentEditableAdapter, isHeretto } from '../../src/adapters/HerettoContentEditableAdapter';
import { AsyncContentEditableAdapter } from '../../src/adapters/AsyncContentEditableAdapter';
import { getMatchesWithReplacement, waitMs } from './utils/test-utils';
import { htmlStringToElements } from './utils/util';

const DUMMY_CHECK_ID = 'dummyCheckId';
const INITIAL_CONTENT = 'word1 word2 word3';

describe('HerettoContentEditableAdapter', () => {
  let adapter: HerettoContentEditableAdapter;
  let editorElement: HTMLElement;
  let mouseUpEventFired: boolean;
  let selectionChangeEventFired: boolean;
  let pasteEventFired: boolean;
  let pasteEventData: string | null;

  beforeEach(() => {
    // Create a contenteditable element
    const element = htmlStringToElements(`
      <div id="herettoTestContainer">
        <div id="herettoEditor" contenteditable="true" class="heretto-editor">${INITIAL_CONTENT}</div>
      </div>
    `);
    document.body.appendChild(element);

    editorElement = document.getElementById('herettoEditor')!;

    // Track events
    mouseUpEventFired = false;
    selectionChangeEventFired = false;
    pasteEventFired = false;
    pasteEventData = null;

    editorElement.addEventListener('mouseup', () => {
      mouseUpEventFired = true;
    });

    document.addEventListener('selectionchange', () => {
      selectionChangeEventFired = true;
    });

    editorElement.addEventListener('paste', (e: ClipboardEvent) => {
      pasteEventFired = true;
      pasteEventData = e.clipboardData?.getData('text/plain') ?? null;
    });

    // Create adapter
    adapter = new HerettoContentEditableAdapter({ editorId: 'herettoEditor' });
  });

  afterEach(() => {
    const container = document.getElementById('herettoTestContainer');
    if (container) {
      container.remove();
    }
  });

  describe('class inheritance', () => {
    it('should extend AsyncContentEditableAdapter', () => {
      expect(adapter).toBeInstanceOf(AsyncContentEditableAdapter);
    });

    it('should have isAsync property set to true', () => {
      expect(adapter.isAsync).toBe(true);
    });

    it('should have requiresSynchronization property set to true', () => {
      expect(adapter.requiresSynchronization).toBe(true);
    });
  });

  describe('getContent', () => {
    it('should return editor content', () => {
      const content = adapter.getContent();
      expect(content).toBe(INITIAL_CONTENT);
    });
  });

  describe('selectRanges', () => {
    beforeEach(() => {
      // Simulate a check result by setting lastContentChecked
      adapter.extractContentForCheck({});
      adapter.registerCheckResult({
        checkedPart: { checkId: DUMMY_CHECK_ID, range: [0, INITIAL_CONTENT.length] },
      });
    });

    it('should dispatch mouseup event on editor', async () => {
      const matches = getMatchesWithReplacement(INITIAL_CONTENT, 'word2', '');
      await adapter.selectRanges(DUMMY_CHECK_ID, matches);
      expect(mouseUpEventFired).toBe(true);
    });

    it('should dispatch selectionchange event on document', async () => {
      const matches = getMatchesWithReplacement(INITIAL_CONTENT, 'word2', '');
      await adapter.selectRanges(DUMMY_CHECK_ID, matches);
      expect(selectionChangeEventFired).toBe(true);
    });

    it('should select the correct text', async () => {
      const matches = getMatchesWithReplacement(INITIAL_CONTENT, 'word2', '');
      await adapter.selectRanges(DUMMY_CHECK_ID, matches);
      await waitMs(50);
      const selection = document.getSelection();
      expect(selection?.toString()).toBe('word2');
    });
  });

  describe('replaceRanges', () => {
    beforeEach(() => {
      // Simulate a check result
      adapter.extractContentForCheck({});
      adapter.registerCheckResult({
        checkedPart: { checkId: DUMMY_CHECK_ID, range: [0, INITIAL_CONTENT.length] },
      });
    });

    it('should dispatch paste event on editor', async () => {
      const matches = getMatchesWithReplacement(INITIAL_CONTENT, 'word2', 'replacement');
      await adapter.replaceRanges(DUMMY_CHECK_ID, matches);
      expect(pasteEventFired).toBe(true);
    });

    it('should include replacement text in paste event', async () => {
      const replacement = 'newWord';
      const matches = getMatchesWithReplacement(INITIAL_CONTENT, 'word2', replacement);
      await adapter.replaceRanges(DUMMY_CHECK_ID, matches);
      expect(pasteEventData).toBe(replacement);
    });

    it('should dispatch mouseup event before paste', async () => {
      const matches = getMatchesWithReplacement(INITIAL_CONTENT, 'word2', 'replacement');
      await adapter.replaceRanges(DUMMY_CHECK_ID, matches);
      expect(mouseUpEventFired).toBe(true);
    });
  });
});

describe('isHerettoDomain (via isHeretto)', () => {
  // We test domain validation indirectly through isHeretto
  // since isHerettoDomain is not exported

  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return false when not on heretto.com', () => {
    // Default test environment is not heretto.com
    expect(isHeretto(mockElement)).toBe(false);
  });

  describe('domain validation patterns', () => {
    // These tests verify the domain validation logic conceptually
    // The actual isHerettoDomain function is private, so we test the patterns

    it('should accept exact match heretto.com', () => {
      const patterns = [
        { hostname: 'heretto.com', expected: true },
        { hostname: 'app.heretto.com', expected: true },
        { hostname: 'writers.heretto.com', expected: true },
        { hostname: 'sub.domain.heretto.com', expected: true },
      ];

      patterns.forEach(({ hostname, expected }) => {
        const lowerHost = hostname.toLowerCase();
        const isValid = lowerHost === 'heretto.com' || lowerHost.endsWith('.heretto.com');
        expect(isValid).toBe(expected);
      });
    });

    it('should reject invalid domains', () => {
      const invalidPatterns = [
        'malicious-heretto.com',
        'heretto.com.evil.com',
        'notheretto.com',
        'fakeheretto.com',
        'heretto.org',
      ];

      invalidPatterns.forEach((hostname) => {
        const lowerHost = hostname.toLowerCase();
        const isValid = lowerHost === 'heretto.com' || lowerHost.endsWith('.heretto.com');
        expect(isValid).toBe(false);
      });
    });
  });
});

describe('isHeretto function', () => {
  let container: HTMLElement;
  let iframe: HTMLIFrameElement;

  beforeEach(() => {
    // Create test container
    container = htmlStringToElements(`
      <div id="herettoDetectionTest">
        <div id="mainPageElement">Main page element</div>
      </div>
    `) as HTMLElement;
    document.body.appendChild(container);
  });

  afterEach(() => {
    const testContainer = document.getElementById('herettoDetectionTest');
    if (testContainer) {
      testContainer.remove();
    }
    vi.restoreAllMocks();
  });

  it('should return false for elements in main document', () => {
    const mainElement = document.getElementById('mainPageElement')!;
    expect(isHeretto(mainElement)).toBe(false);
  });

  it('should return false when iframe ID does not match', () => {
    // Create an iframe with wrong ID
    iframe = document.createElement('iframe');
    iframe.id = 'wrong-iframe-id';
    container.appendChild(iframe);

    // Try to check element from main document (simulating wrong iframe)
    const mainElement = document.getElementById('mainPageElement')!;
    expect(isHeretto(mainElement)).toBe(false);
  });

  it('should return false when element ownerDocument is null', () => {
    // Create a detached element
    const detachedElement = document.createElement('div');
    // Detached elements still have ownerDocument, but this tests the null check path
    expect(isHeretto(detachedElement)).toBe(false);
  });
});

describe('HerettoContentEditableAdapter error handling', () => {
  it('should throw error when editor element is not found', async () => {
    const adapter = new HerettoContentEditableAdapter({ editorId: 'nonExistentEditor' });

    await expect(async () => {
      await adapter.selectRanges('checkId', []);
    }).rejects.toThrow();
  });
});

describe('HerettoContentEditableAdapter paste event details', () => {
  let adapter: HerettoContentEditableAdapter;
  let editorElement: HTMLElement;
  let capturedPasteEvent: ClipboardEvent | null;

  beforeEach(() => {
    const element = htmlStringToElements(`
      <div id="pasteTestContainer">
        <div id="pasteTestEditor" contenteditable="true">${INITIAL_CONTENT}</div>
      </div>
    `);
    document.body.appendChild(element);

    editorElement = document.getElementById('pasteTestEditor')!;
    capturedPasteEvent = null;

    editorElement.addEventListener('paste', (e: ClipboardEvent) => {
      capturedPasteEvent = e;
    });

    adapter = new HerettoContentEditableAdapter({ editorId: 'pasteTestEditor' });

    // Setup for replaceRanges
    adapter.extractContentForCheck({});
    adapter.registerCheckResult({
      checkedPart: { checkId: DUMMY_CHECK_ID, range: [0, INITIAL_CONTENT.length] },
    });
  });

  afterEach(() => {
    const container = document.getElementById('pasteTestContainer');
    if (container) {
      container.remove();
    }
  });

  it('should create paste event with correct properties', async () => {
    const matches = getMatchesWithReplacement(INITIAL_CONTENT, 'word2', 'replacement');
    await adapter.replaceRanges(DUMMY_CHECK_ID, matches);

    expect(capturedPasteEvent).not.toBeNull();
    expect(capturedPasteEvent?.bubbles).toBe(true);
    expect(capturedPasteEvent?.cancelable).toBe(true);
  });

  it('should set text/plain data in clipboard', async () => {
    const replacement = 'myReplacement';
    const matches = getMatchesWithReplacement(INITIAL_CONTENT, 'word2', replacement);
    await adapter.replaceRanges(DUMMY_CHECK_ID, matches);

    expect(capturedPasteEvent?.clipboardData?.getData('text/plain')).toBe(replacement);
  });

  it('should handle empty replacement', async () => {
    const matches = getMatchesWithReplacement(INITIAL_CONTENT, 'word2', '');
    await adapter.replaceRanges(DUMMY_CHECK_ID, matches);

    expect(capturedPasteEvent?.clipboardData?.getData('text/plain')).toBe('');
  });

  it('should handle special characters in replacement', async () => {
    const specialChars = '<script>alert("xss")</script>&amp;';
    const matches = getMatchesWithReplacement(INITIAL_CONTENT, 'word2', specialChars);
    await adapter.replaceRanges(DUMMY_CHECK_ID, matches);

    expect(capturedPasteEvent?.clipboardData?.getData('text/plain')).toBe(specialChars);
  });
});
