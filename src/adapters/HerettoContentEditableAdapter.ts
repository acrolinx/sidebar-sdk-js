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

import { Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { ContentEditableAdapter } from './ContentEditableAdapter';
import { AdapterConf } from './AdapterInterface';
import { assertElementIsDisplayed } from '../utils/utils';
import { scrollIntoViewCenteredWithFallback } from '../utils/scrolling';

/**
 * Default delay in milliseconds to wait for selection events to propagate
 * before applying replacement via paste event.
 */
const SELECTION_SETTLE_DELAY_MS = 50;

/**
 * Custom adapter for Heretto.com that extends ContentEditableAdapter
 * with custom selectRanges and replaceRanges implementation.
 *
 * Heretto uses a GWT-based editor that requires specific DOM events
 * (mouseup, selectionchange) to acknowledge selection changes, and
 * uses paste events for text replacement.
 *
 * IMPORTANT: This adapter avoids DOM modifications during selection/scrolling
 * because Heretto's GWT framework tracks DOM nodes internally. Inserting or
 * removing temporary elements (like the parent class's scrollIntoView does)
 * causes GWT to throw "Node is not connected to the DOM document tree" errors.
 */
export class HerettoContentEditableAdapter extends ContentEditableAdapter {
  constructor(conf: AdapterConf) {
    super(conf);
  }

  /**
   * Override selectRanges with Heretto-specific implementation.
   *
   * Unlike the parent class, this method:
   * 1. Does NOT use the parent's scrollIntoView which inserts/removes temp DOM nodes
   * 2. Uses scrollIntoViewCenteredWithFallback on the selection's anchor element
   * 3. Dispatches mouseup and selectionchange events for GWT
   *
   * @param checkId - The check ID
   * @param matches - Array of matches to select
   */
  selectRanges(checkId: string, matches: Match[]): void {
    assertElementIsDisplayed(this.getEditorElement());

    // Use the parent's selectMatches which creates the selection without DOM modification
    this.selectMatches(checkId, matches);

    // Scroll into view using a method that doesn't modify the DOM
    // (unlike the parent's scrollToCurrentSelection which inserts temp nodes)
    this.scrollToSelectionWithoutDomModification();

    // Dispatch events that Heretto's GWT editor listens for
    this.dispatchHerettoSelectionEvents();
  }

  /**
   * Scroll to the current selection without modifying the DOM.
   * This uses scrollIntoViewCenteredWithFallback on the selection's anchor element,
   * which doesn't insert or remove any temporary elements.
   */
  private scrollToSelectionWithoutDomModification(): void {
    const selection = this.getEditorDocument().getSelection();
    if (selection && selection.anchorNode) {
      // Get the parent element of the selection anchor
      const anchorElement =
        selection.anchorNode.nodeType === Node.ELEMENT_NODE
          ? (selection.anchorNode as HTMLElement)
          : selection.anchorNode.parentElement;

      if (anchorElement) {
        scrollIntoViewCenteredWithFallback(anchorElement);
      }
    }
  }

  /**
   * Dispatch mouseup and selectionchange events to notify Heretto's GWT editor
   * about the selection change. GWT editors typically listen for these events
   * to update their internal state.
   */
  private dispatchHerettoSelectionEvents(): void {
    const editor = this.getEditorElement();
    const doc = this.getEditorDocument();

    // GWT editors often listen for 'mouseup' on the editor element
    editor.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
      }),
    );

    // Also dispatch selectionchange on the document
    doc.dispatchEvent(
      new Event('selectionchange', {
        bubbles: true,
      }),
    );

    console.log('HerettoContentEditableAdapter: Selection events dispatched');
  }

  /**
   * Override replaceRanges with custom implementation for Heretto.com.
   * Uses paste event to apply replacements in the Heretto editor.
   *
   * The replacement is done asynchronously:
   * 1. First select the text (synchronously)
   * 2. Wait for selection events to propagate
   * 3. Apply replacement via paste event
   *
   * @param checkId - The check ID
   * @param matchesWithReplacement - Array of matches with replacement suggestions
   */
  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): void {
    console.log('HerettoContentEditableAdapter.replaceRanges called', {
      checkId,
      matchesCount: matchesWithReplacement.length,
      matches: matchesWithReplacement,
    });

    // Step 1: Select the content that needs to be replaced
    // This will select the text in the editor and scroll it into view
    this.selectRanges(checkId, matchesWithReplacement);

    // Step 2: Apply replacement using paste event (with delay to allow selection to settle)
    // The delay ensures GWT editor has processed the selection events
    const replacement = matchesWithReplacement.map((m) => m.replacement).join('');

    setTimeout(() => {
      this.applyReplacementViaPaste(replacement);
    }, SELECTION_SETTLE_DELAY_MS);
  }

  /**
   * Apply replacement text using the paste event trick.
   * This mimics how a user would paste text to replace a selection,
   * which Heretto's GWT editor handles correctly.
   *
   * @param replacementText - The text to insert in place of the selection
   */
  private applyReplacementViaPaste(replacementText: string): void {
    const editor = this.getEditorElement();

    if (!editor) {
      console.error('HerettoContentEditableAdapter: Editor element not found');
      return;
    }

    if (!editor.isContentEditable) {
      console.error('HerettoContentEditableAdapter: Editor is not content editable');
      return;
    }

    // Create DataTransfer with the replacement text
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', replacementText);

    // Create and dispatch paste event
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true,
    });

    editor.dispatchEvent(pasteEvent);
    console.log('HerettoContentEditableAdapter: Paste event dispatched with replacement:', replacementText);
  }
}

/**
 * Check if the element is in a Heretto.com editor
 * The element should be within an iframe with class "gwt-Frame"
 * @param el - The element to check
 * @returns true if on Heretto.com domain and element is in gwt-Frame iframe
 */
export function isHeretto(el: Element): boolean {
  // First check if we're on heretto.com
  if (!document.location.host.includes('heretto.com')) {
    return false;
  }

  // Check if the element's document is from an iframe with class "gwt-Frame"
  const ownerDocument = el.ownerDocument;
  if (!ownerDocument || ownerDocument === document) {
    return false;
  }

  // Find the iframe element in the parent document
  const iframes = document.querySelectorAll('iframe.gwt-Frame');
  for (let i = 0; i < iframes.length; i++) {
    const iframe = iframes[i] as HTMLIFrameElement;
    try {
      if (iframe.contentDocument === ownerDocument || iframe.contentWindow?.document === ownerDocument) {
        console.log('HerettoContentEditableAdapter: Detected element in gwt-Frame iframe', el);
        return true;
      }
    } catch (e) {
      // Cross-origin iframe, skip
      continue;
    }
  }

  return false;
}
