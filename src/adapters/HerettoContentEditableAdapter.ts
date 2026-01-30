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

import { MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { ContentEditableAdapter } from './ContentEditableAdapter';
import { AdapterConf } from './AdapterInterface';

/**
 * Custom adapter for Heretto.com that extends ContentEditableAdapter
 * with custom replaceRanges implementation
 */
export class HerettoContentEditableAdapter extends ContentEditableAdapter {
  constructor(conf: AdapterConf) {
    super(conf);
  }

  /**
   * Override replaceRanges with custom implementation for Heretto.com
   * Uses paste event to apply replacements in the Heretto editor
   * 
   * @param checkId - The check ID
   * @param matchesWithReplacement - Array of matches with replacement suggestions
   */
  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): void {
    console.log('HerettoContentEditableAdapter.replaceRanges called', {
      checkId,
      matchesCount: matchesWithReplacement.length,
      matches: matchesWithReplacement
    });

    // Step 1: Highlight the content that needs to be changed
    // This will select the text in the editor and scroll it into view
    this.selectRanges(checkId, matchesWithReplacement);
    
    // Step 2: Focus the editor element to ensure it's active
    const editorElement = this.getEditorElement();
    editorElement.focus();
    
    // Step 3: Get the combined replacement text from all matches
    const replacementText = matchesWithReplacement.map((m) => m.replacement).join('');
    
    console.log('HerettoContentEditableAdapter: Replacement text:', replacementText);
    
    // Step 4: CRITICAL - Use setTimeout(0) to defer replacement to next event loop
    // This ensures the selection is fully processed before we attempt replacement
    // This pattern is used by Congree and other extensions for GWT/Heretto editors
    setTimeout(() => {
      console.log('HerettoContentEditableAdapter: Executing replacement in next event loop');
      
      const editorDocument = this.getEditorDocument();
      const selection = editorDocument.getSelection();
      
      console.log('HerettoContentEditableAdapter: Selection status:', {
        rangeCount: selection?.rangeCount,
        selectedText: selection?.toString(),
        isCollapsed: selection?.isCollapsed,
        anchorNode: selection?.anchorNode?.nodeName,
        focusNode: selection?.focusNode?.nodeName
      });
      
      if (!selection || selection.rangeCount === 0) {
        console.error('HerettoContentEditableAdapter: No selection available after setTimeout');
        return;
      }
      
      const activeElement = editorDocument.activeElement as HTMLElement;
      
      if (!activeElement || !activeElement.isContentEditable) {
        console.error('HerettoContentEditableAdapter: Active element is not contentEditable');
        return;
      }
      
      console.log('HerettoContentEditableAdapter: Active element:', activeElement);
      
      // Approach 1: Try execCommand('paste') with clipboard
      this.tryExecCommandPaste(editorDocument, activeElement, replacementText, selection);
    }, 0);
  }

  /**
   * Try to replace text using execCommand('paste')
   * This is the preferred method as it triggers Heretto's save mechanism
   */
  private tryExecCommandPaste(
    editorDocument: Document,
    activeElement: HTMLElement,
    replacementText: string,
    selection: Selection
  ): void {
    console.log('HerettoContentEditableAdapter: Attempting execCommand paste approach');
    
    // Write to clipboard first
    navigator.clipboard.writeText(replacementText).then(() => {
      console.log('HerettoContentEditableAdapter: Text written to clipboard');
      
      // Execute paste command
      const pasteSuccess = editorDocument.execCommand('paste', false);
      
      console.log('HerettoContentEditableAdapter: execCommand paste result:', {
        success: pasteSuccess,
        replacementText: replacementText
      });
      
      if (!pasteSuccess) {
        console.warn('HerettoContentEditableAdapter: execCommand paste failed, trying direct DOM manipulation');
        this.tryDirectDOMManipulation(editorDocument, activeElement, replacementText, selection);
      }
    }).catch((error) => {
      console.error('HerettoContentEditableAdapter: Failed to write to clipboard:', error);
      // Fallback to direct DOM manipulation
      this.tryDirectDOMManipulation(editorDocument, activeElement, replacementText, selection);
    });
  }

  /**
   * Fallback: Direct DOM manipulation with event triggering
   * This manually replaces the content and triggers events to notify Heretto
   */
  private tryDirectDOMManipulation(
    editorDocument: Document,
    activeElement: HTMLElement,
    replacementText: string,
    selection: Selection
  ): void {
    console.log('HerettoContentEditableAdapter: Using direct DOM manipulation fallback');
    
    try {
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        console.log('HerettoContentEditableAdapter: Deleting selected content and inserting new text');
        
        // Delete the selected content
        range.deleteContents();
        
        // Insert the replacement text
        const textNode = editorDocument.createTextNode(replacementText);
        range.insertNode(textNode);
        
        // Move cursor to end of inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        console.log('HerettoContentEditableAdapter: Text replaced, triggering events');
        
        // Trigger events to notify Heretto's save mechanism
        // These events are critical for Heretto to detect changes
        const events = [
          new Event('input', { bubbles: true, cancelable: true }),
          new Event('change', { bubbles: true, cancelable: true }),
          new InputEvent('beforeinput', { bubbles: true, cancelable: true }),
          new InputEvent('input', { bubbles: true, cancelable: true })
        ];
        
        events.forEach(event => {
          activeElement.dispatchEvent(event);
        });
        
        console.log('HerettoContentEditableAdapter: Direct DOM manipulation completed successfully');
      }
    } catch (error) {
      console.error('HerettoContentEditableAdapter: Direct DOM manipulation failed:', error);
      
      // Last resort: Try paste event with DataTransfer
      this.tryPasteEvent(activeElement, replacementText);
    }
  }

  /**
   * Last resort: Try dispatching a paste event with DataTransfer
   */
  private tryPasteEvent(activeElement: HTMLElement, replacementText: string): void {
    console.log('HerettoContentEditableAdapter: Trying paste event with DataTransfer as last resort');
    
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', replacementText);

    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });

    const dispatched = activeElement.dispatchEvent(pasteEvent);
    
    console.log('HerettoContentEditableAdapter: Paste event dispatched:', {
      dispatched: dispatched,
      replacementText: replacementText
    });
  }

  // All other methods are inherited from ContentEditableAdapter:
  // - getEditorElement()
  // - getContent()
  // - getSelection()
  // - getEditorDocument()
  // - extractContentForCheck()
  // - selectRanges()
  // - registerCheckCall()
  // - registerCheckResult()
  // - onInitFinished()
  // - getFormat()
  // - getAutobindWrapperAttributes()
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
