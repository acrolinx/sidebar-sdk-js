/*
 * Copyright 2026-present Markup AI, Inc.
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
import { AsyncContentEditableAdapter } from './AsyncContentEditableAdapter';
import { AdapterConf } from './AdapterInterface';
import { waitMs } from '../utils/utils';

/**
 * Default delay in milliseconds to wait for selection events to propagate
 * before applying replacement via paste event.
 */
const SELECTION_SETTLE_DELAY_MS = 50;

/**
 * The Heretto domain.
 */
const HERETTO_DOMAIN = 'heretto.com';

/**
 * Check if the hostname is a valid Heretto domain.
 * Matches exactly "heretto.com" or any subdomain like "app.heretto.com".
 *
 * @param hostname - The hostname to check
 * @returns true if hostname is heretto.com or a subdomain of it
 */
function isHerettoDomain(hostname: string): boolean {
  const lowerHost = hostname.toLowerCase();
  // Exact match: heretto.com
  if (lowerHost === HERETTO_DOMAIN) {
    return true;
  }
  // Subdomain match: *.heretto.com (must have dot before heretto.com)
  if (lowerHost.endsWith('.' + HERETTO_DOMAIN)) {
    return true;
  }
  return false;
}

/**
 * The specific iframe ID used by Heretto's DITA editor.
 */
const HERETTO_EDITOR_IFRAME_ID = 'gwt-debug-PreviewViewImpl.previewFrame';

/**
 * Custom adapter for Heretto.com that extends AsyncContentEditableAdapter
 * with custom selectRanges and replaceRanges implementation.
 *
 */
export class HerettoContentEditableAdapter extends AsyncContentEditableAdapter {
  constructor(conf: AdapterConf) {
    super(conf);
  }

  /**
   * Override selectRanges to add Heretto-specific event dispatching.
   *
   * @param checkId - The check ID
   * @param matches - Array of matches to select
   * @returns Promise that resolves when selection is complete
   */
  async selectRanges(checkId: string, matches: Match[]): Promise<void> {
    // Use parent's selectRanges which has safe scrollIntoView (no temp DOM nodes)
    await super.selectRanges(checkId, matches);

    // Dispatch events that Heretto's GWT editor listens for
    this.dispatchHerettoSelectionEvents();
  }

  /**
   * Dispatch mouseup and selectionchange events to notify Heretto's GWT editor
   * about the selection change.
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
   * 1. First select the text
   * 2. Wait for selection events to propagate
   * 3. Apply replacement via paste event
   *
   * @param checkId - The check ID
   * @param matchesWithReplacement - Array of matches with replacement suggestions
   * @returns Promise that resolves when replacement is complete, rejects on error
   */
  async replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): Promise<void> {
    console.log('HerettoContentEditableAdapter.replaceRanges called', {
      checkId,
      matchesCount: matchesWithReplacement.length,
      matches: matchesWithReplacement,
    });

    await this.selectRanges(checkId, matchesWithReplacement);
    await waitMs(SELECTION_SETTLE_DELAY_MS);
    const replacement = matchesWithReplacement.map((m) => m.replacement).join('');
    this.applyReplacementViaPaste(replacement);
  }

  /**
   * Apply replacement text using the paste event.
   *
   * @param replacementText - The text to insert in place of the selection
   * @throws Error if editor is not found or not editable
   */
  private applyReplacementViaPaste(replacementText: string): void {
    const editor = this.getEditorElement();

    if (!editor) {
      const error = 'HerettoContentEditableAdapter: Editor element not found';
      console.error(error);
      throw new Error(error);
    }

    if (!editor.isContentEditable) {
      const error = 'HerettoContentEditableAdapter: Editor is not content editable';
      console.error(error);
      throw new Error(error);
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', replacementText);

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
 * Check if the element is in a Heretto.com DITA editor.
 *
 * Detection is based on multiple robust identifiers:
 * 1. Domain check: must be on heretto.com
 * 2. Iframe ID: element must be inside iframe with id "gwt-debug-PreviewViewImpl.previewFrame"
 * 3. Body class: Heretto editor body has class "heretto"
 *
 * @param el - The element to check
 * @returns true if element is in the Heretto DITA editor
 */
export function isHeretto(el: Element): boolean {
  // Check if we're on heretto.com or a subdomain (e.g., app.heretto.com)
  if (!isHerettoDomain(document.location.hostname)) {
    return false;
  }

  const ownerDocument = el.ownerDocument;
  if (!ownerDocument) {
    return false;
  }

  if (ownerDocument === document) {
    return false;
  }

  const herettoIframe = document.getElementById(HERETTO_EDITOR_IFRAME_ID) as HTMLIFrameElement | null;
  if (!herettoIframe) {
    return false;
  }

  try {
    if (herettoIframe.contentDocument !== ownerDocument && herettoIframe.contentWindow?.document !== ownerDocument) {
      return false;
    }
  } catch {
    // Cross-origin access error - not the right iframe
    return false;
  }

  const body = ownerDocument.body;
  if (!body?.classList.contains('heretto')) {
    return false;
  }
  return true;
}
