# Acrolinx Sidebar SDK: Highlighting and Scrolling Troubleshooting Guide

## Legal Notice and Usage Restrictions

**CONFIDENTIAL AND PROPRIETARY**

This document and all associated materials are the intellectual property of Acrolinx GmbH. All rights reserved.

**Usage Restrictions:**
- This document is provided exclusively for support and use within the current project engagement
- No part of this document may be reproduced, distributed, or transmitted in any form or by any means without prior written permission from Acrolinx GmbH
- This material is confidential and proprietary to Acrolinx GmbH and is intended solely for the authorized recipient
- Any unauthorized use, reproduction, or distribution is strictly prohibited

**Copyright Notice:**
© 2025 Acrolinx GmbH. All rights reserved.

---

## Overview

This guide addresses common issues with text highlighting and page navigation in Acrolinx Sidebar SDK integrations. When a check is completed, the sidebar should highlight flagged text and automatically scroll to bring the highlighted content into view.

## Common Issues

### 1. Text Not Highlighting After Check
- **Symptom**: Check completes but no text is highlighted in the editor
- **Cause**: Adapter configuration issues or editor compatibility problems

### 2. Page Not Scrolling to Highlighted Text
- **Symptom**: Text is highlighted but page doesn't scroll to show it
- **Cause**: Missing scroll configuration or container setup issues

### 3. Highlighting/Scrolling Works Inconsistently
- **Symptom**: Sometimes works, sometimes doesn't
- **Cause**: Browser compatibility issues or timing problems

## Root Causes and Solutions

### Configuration Issues

#### Missing Scroll Offset Configuration
```javascript
// Problem: No scroll offset configured
const adapter = new ContentEditableAdapter({
  element: editorElement
});

// Solution: Add scroll offset for headers/fixed elements
const adapter = new ContentEditableAdapter({
  element: editorElement,
  scrollOffsetY: 80  // Adjust based on your header height
});
```

#### Incorrect Adapter Selection
```javascript
// Problem: Using wrong adapter for editor type
const adapter = new ContentEditableAdapter({ element: quillEditor });

// Solution: Use appropriate adapter
// For Quill editor
const adapter = new QuillAdapter({ element: quillEditor });

// For React state-based editors (Draft.js, Slate)
const adapter = new AsyncContentEditableAdapter({ element: editorElement });
```

#### Missing Plugin Configuration
```javascript
// Problem: Selection checking not enabled
const config = {
  sidebarContainerId: 'sidebar',
  sidebarUrl: 'https://acrolinx-server.com/sidebar'
};

// Solution: Enable selection checking
const config = {
  sidebarContainerId: 'sidebar',
  sidebarUrl: 'https://acrolinx-server.com/sidebar',
  checkSelection: true  // Critical for highlighting
};
```

### Editor Container Issues

#### Non-Scrollable Container
```css
/* Problem: Container not scrollable */
.editor-container {
  height: 400px;
  /* Missing overflow property */
}

/* Solution: Make container scrollable */
.editor-container {
  height: 400px;
  overflow: auto;
  position: relative;
}
```

#### Fixed Height Without Overflow
```javascript
// Problem: Editor element not properly sized
const editorElement = document.getElementById('editor');
editorElement.style.height = '400px';

// Solution: Ensure proper sizing and overflow
const editorElement = document.getElementById('editor');
editorElement.style.height = '400px';
editorElement.style.overflow = 'auto';
editorElement.style.position = 'relative';
```

### Browser Compatibility Issues

#### Modern Scrolling Not Supported
```javascript
// Problem: Assuming modern scrolling is always available
element.scrollIntoView({ block: 'center' });

// Solution: Check compatibility and provide fallback
function scrollToElement(element) {
  try {
    element.scrollIntoView({ block: 'center' });
  } catch (e) {
    // Fallback for older browsers
    element.scrollIntoView();
  }
}
```

#### Chrome-Specific Issues
```javascript
// Problem: Chrome empty text node bug
// The SDK handles this automatically, but you might need to ensure
// your editor doesn't create problematic DOM structures

// Solution: Use SDK's built-in Chrome handling
// The SDK includes workarounds for Chrome bugs in text node handling
```

## Editor-Specific Solutions

### React ContentEditable
```javascript
import { AcrolinxPlugin, ContentEditableAdapter } from '@acrolinx/sidebar-sdk';

function ReactEditor() {
  const editorRef = useRef(null);
  
  useEffect(() => {
    if (editorRef.current) {
      const config = {
        sidebarContainerId: 'acrolinx-sidebar',
        sidebarUrl: 'https://acrolinx-server.com/sidebar',
        checkSelection: true,
        onCheckResult: (result) => {
          console.log('Check completed');
        }
      };

      const plugin = new AcrolinxPlugin(config);
      
      const adapter = new ContentEditableAdapter({
        element: editorRef.current,
        scrollOffsetY: 80,  // Adjust for your header
        disableInputEventSimulation: false
      });
      
      plugin.registerAdapter(adapter);
      plugin.init();
    }
  }, []);

  return (
    <div>
      <div 
        ref={editorRef}
        contentEditable
        style={{ 
          minHeight: '400px',
          border: '1px solid #ccc',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        Start typing here...
      </div>
      <div id="acrolinx-sidebar"></div>
    </div>
  );
}
```

### State-Based Editors (Draft.js, Slate)
```javascript
import { AsyncContentEditableAdapter } from '@acrolinx/sidebar-sdk';

// For state-based editors, use the async adapter
const adapter = new AsyncContentEditableAdapter({
  element: editorElement,
  scrollOffsetY: 80
});

// Ensure the editor is focused before selection
adapter.selectRanges = async function(checkId, matches) {
  this.getEditorElement().click(); // Ensure focus
  await this.selectMatches(checkId, matches);
  this.scrollToCurrentSelection();
};
```

### Custom Adapter Implementation

**Key Principle**: When building a custom adapter, **always use your editor's native API** for selection and scrolling. The Acrolinx SDK provides text position mapping utilities, but the actual selection and scrolling must be done through your editor's API.

#### Essential Pattern for Custom Adapters

Without knowing which specific editor you're integrating with, the general pattern is:

```javascript
selectRanges(checkId: string, matches: Match[]): void {
  // 1. Map Acrolinx text positions to your editor's coordinate system
  const editorMatches = this.mapMatchesToEditorPositions(matches);
  
  // 2. Use YOUR editor's native selection API
  const firstMatch = editorMatches[0];
  myLovelyEditor.select(firstMatch.start, firstMatch.end);
  
  // 3. Use YOUR editor's native scrolling API
  myLovelyEditor.scrollToSelection();
}
```

The key is that `myLovelyEditor.select()` and `myLovelyEditor.scrollToSelection()` must be replaced with your actual editor's API methods. Common examples:

- **CodeMirror**: `editor.setSelection(from, to)` and `editor.scrollIntoView(pos)`
- **Monaco**: `editor.setSelection(range)` and `editor.revealLine(lineNumber)`
- **Quill**: `editor.setSelection(index, length)` and `editor.scrollIntoView()`
- **Draft.js**: Custom selection state management and scrolling
- **Slate**: Custom selection operations and scrolling

#### Complete Implementation Example

```javascript
import { AdapterInterface, Match, MatchWithReplacement } from '@acrolinx/sidebar-sdk';

class CustomEditorAdapter implements AdapterInterface {
  constructor(private element: HTMLElement, private myLovelyEditor: any, private config: any) {}

  // Required for highlighting - CRITICAL: Use your editor's native selection API
  selectRanges(checkId: string, matches: Match[]): void {
    if (!matches || matches.length === 0) return;

    // 1. Map Acrolinx matches to your editor's text positions
    const editorMatches = this.mapMatchesToEditorPositions(matches);
    
    // 2. Use YOUR EDITOR'S API for selection (not DOM manipulation)
    const firstMatch = editorMatches[0];
    this.myLovelyEditor.select(firstMatch.start, firstMatch.end);
    
    // 3. Use YOUR EDITOR'S API for scrolling (not generic scrollIntoView)
    this.myLovelyEditor.scrollToSelection();
  }

  // Required for text replacement
  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): void {
    // Apply replacements in reverse order to maintain positions
    const sortedMatches = [...matchesWithReplacement].sort((a, b) => b.range[0] - a.range[0]);
    
    sortedMatches.forEach(match => {
      const editorMatch = this.mapMatchToEditorPosition(match);
      
      // Use YOUR EDITOR'S API for text replacement
      this.myLovelyEditor.replaceText(
        editorMatch.start, 
        editorMatch.end, 
        match.replacement
      );
    });
    
    // Scroll to show the changes
    this.myLovelyEditor.scrollToSelection();
  }

  // Map Acrolinx positions to your editor's coordinate system
  private mapMatchesToEditorPositions(matches: Match[]): any[] {
    // Use SDK utilities to align text positions
    import { lookupMatches, extractTextDomMapping } from '@acrolinx/sidebar-sdk';
    
    const textMapping = extractTextDomMapping(this.element);
    const alignedMatches = lookupMatches(
      this.lastContentChecked, 
      textMapping.text, 
      matches
    );
    
    return alignedMatches.map(match => ({
      start: this.convertToEditorPosition(match.range[0]),
      end: this.convertToEditorPosition(match.range[1]),
      originalMatch: match.originalMatch
    }));
  }

  private mapMatchToEditorPosition(match: Match): any {
    return {
      start: this.convertToEditorPosition(match.range[0]),
      end: this.convertToEditorPosition(match.range[1])
    };
  }

  // Convert from DOM text position to your editor's position format
  private convertToEditorPosition(domPosition: number): any {
    // This depends entirely on your editor's API
    // Examples for different editor types:
    
    // For line/column based editors:
    // return this.myLovelyEditor.positionFromOffset(domPosition);
    
    // For node-based editors:
    // return this.myLovelyEditor.getPositionFromIndex(domPosition);
    
    // For simple offset-based editors:
    // return domPosition;
    
    // Implement based on YOUR editor's coordinate system
    return this.myLovelyEditor.offsetToPosition(domPosition);
  }

  // Required interface methods
  extractContentForCheck(opts: any): any {
    return {
      content: this.myLovelyEditor.getContent(), // Use editor's API
      selection: opts.checkSelection ? this.myLovelyEditor.getSelection() : undefined
    };
  }

  registerCheckCall(checkInfo: any): void {
    this.currentCheck = checkInfo;
  }

  registerCheckResult(checkResult: any): void {
    this.lastCheckResult = checkResult;
    this.lastContentChecked = checkResult.content;
  }
}
```

### Common Custom Adapter Issues

#### 1. Using DOM Manipulation Instead of Editor API
```javascript
// Problem: Trying to manipulate DOM directly
selectRanges(checkId: string, matches: Match[]): void {
  const range = document.createRange();
  range.setStart(textNode, startOffset);
  range.setEnd(textNode, endOffset);
  // This breaks editor state and doesn't work with complex editors
}

// Solution: Use your editor's native selection API
selectRanges(checkId: string, matches: Match[]): void {
  const editorMatches = this.mapMatchesToEditorPositions(matches);
  const firstMatch = editorMatches[0];
  
  // Use YOUR editor's API - examples:
  this.myLovelyEditor.select(firstMatch.start, firstMatch.end);        // Generic
  this.myCodeMirror.setSelection(firstMatch.start, firstMatch.end);    // CodeMirror
  this.myMonacoEditor.setSelection(firstMatch.range);                  // Monaco
  this.myQuillEditor.setSelection(firstMatch.index, firstMatch.length); // Quill
}
```

#### 2. Generic Scrolling Instead of Editor-Specific Scrolling
```javascript
// Problem: Using generic scrollIntoView
private scrollToSelection(): void {
  const element = this.getSelectedElement();
  element.scrollIntoView(); // Doesn't work well with complex editors
}

// Solution: Use your editor's native scrolling
private scrollToSelection(): void {
  // Use YOUR editor's API - examples:
  this.myLovelyEditor.scrollToSelection();                    // Generic
  this.myCodeMirror.scrollIntoView(this.myCodeMirror.getCursor()); // CodeMirror
  this.myMonacoEditor.revealLine(lineNumber);                 // Monaco
  this.myQuillEditor.scrollIntoView();                        // Quill
}
```

#### 3. Incorrect Position Mapping
```javascript
// Problem: Assuming direct character mapping
private mapMatchesToEditor(matches: Match[]): any[] {
  // This often fails with complex editors
  return matches.map(match => ({
    start: match.range[0],
    end: match.range[1]
  }));
}

// Solution: Convert positions to your editor's coordinate system
private mapMatchesToEditorPositions(matches: Match[]): any[] {
  import { lookupMatches, extractTextDomMapping } from '@acrolinx/sidebar-sdk';
  
  const textMapping = extractTextDomMapping(this.element);
  const alignedMatches = lookupMatches(
    this.lastContentChecked, 
    textMapping.text, 
    matches
  );
  
  return alignedMatches.map(match => {
    // Convert to YOUR editor's position format
    const start = this.convertToEditorPosition(match.range[0]);
    const end = this.convertToEditorPosition(match.range[1]);
    
    return { start, end, originalMatch: match.originalMatch };
  });
}

private convertToEditorPosition(domOffset: number): any {
  // Examples for different editor types:
  
  // CodeMirror: Convert offset to {line, ch}
  // return this.myCodeMirror.posFromIndex(domOffset);
  
  // Monaco: Convert offset to Position
  // return this.myMonacoEditor.getModel().getPositionAt(domOffset);
  
  // Quill: Convert offset to index
  // return this.myQuillEditor.getSelection().index + domOffset;
  
  // Your editor's specific conversion
  return this.myLovelyEditor.offsetToPosition(domOffset);
}
```

#### 4. Not Handling Editor State Changes
```javascript
// Problem: Not considering editor's internal state
selectRanges(checkId: string, matches: Match[]): void {
  // Direct selection without considering editor state
  this.myLovelyEditor.select(start, end);
}

// Solution: Ensure editor is ready and handle state properly
selectRanges(checkId: string, matches: Match[]): void {
  // 1. Ensure editor is focused and ready
  this.myLovelyEditor.focus();
  
  // 2. Wait for editor to be ready (if async)
  if (this.myLovelyEditor.isReady) {
    await this.myLovelyEditor.ready();
  }
  
  // 3. Perform selection
  const editorMatches = this.mapMatchesToEditorPositions(matches);
  const firstMatch = editorMatches[0];
  this.myLovelyEditor.select(firstMatch.start, firstMatch.end);
  
  // 4. Scroll to selection
  this.myLovelyEditor.scrollToSelection();
}
```

### Custom Adapter Best Practices

#### 1. Always Use Your Editor's Native API
```javascript
// Wrong: Trying to manipulate DOM or use generic methods
selectRanges(checkId: string, matches: Match[]): void {
  const range = document.createRange(); // DON'T DO THIS
  element.scrollIntoView(); // DON'T DO THIS
}

// Right: Use your editor's specific API
selectRanges(checkId: string, matches: Match[]): void {
  const editorMatches = this.mapMatchesToEditorPositions(matches);
  const firstMatch = editorMatches[0];
  
  // Use YOUR editor's API methods
  this.myLovelyEditor.select(firstMatch.start, firstMatch.end);
  this.myLovelyEditor.scrollToSelection();
}
```

#### 2. Implement Proper Error Handling
```javascript
selectRanges(checkId: string, matches: Match[]): void {
  try {
    const editorMatches = this.mapMatchesToEditorPositions(matches);
    const firstMatch = editorMatches[0];
    
    // Use your editor's API with error handling
    this.myLovelyEditor.select(firstMatch.start, firstMatch.end);
    this.myLovelyEditor.scrollToSelection();
  } catch (error) {
    console.error('Failed to select ranges:', error);
    // Fallback: at least try to focus the editor
    this.myLovelyEditor.focus();
  }
}
```

#### 3. Handle Async Operations
```javascript
// For editors with async operations
class AsyncCustomAdapter implements AsyncAdapterInterface {
  readonly isAsync = true;
  readonly requiresSynchronization = true;

  async selectRanges(checkId: string, matches: Match[]): Promise<void> {
    // Wait for editor to be ready
    await this.myLovelyEditor.ready();
    
    // Map positions and perform selection
    const editorMatches = this.mapMatchesToEditorPositions(matches);
    const firstMatch = editorMatches[0];
    
    // Use your editor's async API
    await this.myLovelyEditor.select(firstMatch.start, firstMatch.end);
    await this.myLovelyEditor.scrollToSelection();
  }
}
```

#### 4. Test Your Custom Adapter
```javascript
// Test selection and scrolling with your editor's API
function testCustomAdapter(adapter: CustomEditorAdapter) {
  // Set content using your editor's API
  adapter.myLovelyEditor.setContent('This is a test sentence.');
  
  // Test selection
  const testMatches = [{
    range: [5, 7], // "is"
    content: 'is',
    replacement: 'was'
  }];
  
  adapter.selectRanges('test', testMatches);
  
  // Verify selection using your editor's API
  const selectedText = adapter.myLovelyEditor.getSelectedText();
  console.log('Selected text:', selectedText);
  
  // Verify scrolling worked
  const isVisible = adapter.myLovelyEditor.isSelectionVisible();
  console.log('Selection visible:', isVisible);
}
```

### Debugging Custom Adapters

#### 1. Verify Interface Implementation
```javascript
// Check if your adapter implements all required methods
function verifyAdapter(adapter: any): boolean {
  const requiredMethods = [
    'extractContentForCheck',
    'selectRanges', 
    'replaceRanges',
    'registerCheckCall',
    'registerCheckResult'
  ];
  
  return requiredMethods.every(method => 
    typeof adapter[method] === 'function'
  );
}
```

#### 2. Test Text Mapping
```javascript
// Test if text positions are mapped correctly
function testTextMapping(adapter: CustomEditorAdapter) {
  const content = 'Hello world test';
  adapter.editor.setContent(content);
  
  const result = adapter.extractContentForCheck({});
  console.log('Extracted content:', result.content);
  
  // Test if positions match
  const testMatch = { range: [6, 11], content: 'world' };
  const mapped = adapter.mapMatchesToEditor([testMatch]);
  console.log('Mapped position:', mapped[0]);
}
```

#### 3. Monitor Selection Events
```javascript
// Add event listeners to debug selection
class DebugCustomAdapter extends CustomEditorAdapter {
  selectRanges(checkId: string, matches: Match[]): void {
    console.log('selectRanges called with:', { checkId, matches });
    
    super.selectRanges(checkId, matches);
    
    // Verify selection was applied
    const currentSelection = this.getCurrentSelection();
    console.log('Current selection after selectRanges:', currentSelection);
  }
}
```

## Debugging Steps

### 1. Check Console for Errors
```javascript
// Add error logging to your configuration
const config = {
  // ... other config
  onInitFinished: (result) => {
    if (result.error) {
      console.error('Acrolinx initialization failed:', result.error);
    } else {
      console.log('Acrolinx initialized successfully');
    }
  },
  onCheckResult: (result) => {
    console.log('Check result received:', result);
  }
};
```

### 2. Verify Element Display
```javascript
// Check if editor element is properly displayed
function verifyEditorSetup(editorElement) {
  if (editorElement.offsetParent === null) {
    console.error('Editor element is not displayed');
    return false;
  }
  
  if (editorElement.offsetHeight === 0) {
    console.error('Editor element has no height');
    return false;
  }
  
  return true;
}
```

### 3. Test Scrolling Manually
```javascript
// Test if scrolling works manually
function testScrolling(editorElement) {
  const testElement = document.createElement('div');
  testElement.textContent = 'Test element for scrolling';
  testElement.style.position = 'absolute';
  testElement.style.bottom = '0';
  editorElement.appendChild(testElement);
  
  try {
    testElement.scrollIntoView({ block: 'center' });
    console.log('Modern scrolling supported');
  } catch (e) {
    console.log('Using fallback scrolling');
    testElement.scrollIntoView();
  }
  
  editorElement.removeChild(testElement);
}
```

### 4. Check Browser Compatibility
```javascript
// Test browser scrolling support
function checkScrollingSupport() {
  const isModernScrollingSupported = 'scrollBehavior' in document.body.style;
  console.log('Modern scrolling supported:', isModernScrollingSupported);
  return isModernScrollingSupported;
}
```

## Configuration Checklist

### Required Configuration
- [ ] `checkSelection: true` in plugin config
- [ ] `scrollOffsetY` set in adapter config
- [ ] Editor container has `overflow: auto`
- [ ] Editor element has proper height
- [ ] Correct adapter type for your editor

### Recommended Configuration
- [ ] Error handling in `onInitFinished`
- [ ] Logging in `onCheckResult`
- [ ] Browser compatibility checks
- [ ] Manual scrolling tests
- [ ] Console error monitoring

## Common Fixes Summary

1. **Add `scrollOffsetY`** - Most common fix for scrolling issues
2. **Enable `checkSelection`** - Required for highlighting
3. **Use correct adapter** - Match adapter to editor type
4. **Make container scrollable** - Ensure proper CSS overflow
5. **Handle async editors** - Use AsyncContentEditableAdapter for state-based editors
6. **Test browser compatibility** - Provide fallbacks for older browsers

## Testing Your Fix

After implementing fixes, test with:

1. **Short content** - Ensure highlighting works with minimal text
2. **Long content** - Verify scrolling works with content that exceeds viewport
3. **Multiple checks** - Test that highlighting works consistently across multiple checks
4. **Different browsers** - Test in Chrome, Firefox, Safari, Edge
5. **Mobile devices** - Test on mobile browsers if applicable

## Getting Help

If issues persist after following this guide:

1. Check the browser console for errors
2. Test with a simple contentEditable element first
3. Review the [Acrolinx SDK documentation](https://github.com/acrolinx/sidebar-sdk-js)
4. Contact Acrolinx support with specific error messages and configuration details

## Key Takeaways

- **Use your editor's native API** - Never manipulate DOM directly for selection/scrolling
- **Scroll offset is critical** - Always configure `scrollOffsetY`
- **Selection checking must be enabled** - Set `checkSelection: true`
- **Container must be scrollable** - Use proper CSS overflow
- **Use appropriate adapter** - Match adapter to editor type
- **Test browser compatibility** - Modern scrolling isn't universal
- **Monitor console errors** - SDK provides helpful error messages

## Critical Principle for Custom Adapters

**Without knowing which editor you're dealing with, it's impossible to provide specific selection recommendations.** The fundamental rule is:

```javascript
// In selectRanges, always use YOUR editor's API:
myLovelyEditor.select(start, end);
myLovelyEditor.scrollToSelection();
```

Replace `myLovelyEditor` with your actual editor instance and use its specific API methods. The Acrolinx SDK handles text position mapping, but selection and scrolling must be done through your editor's native API.

Remember: The Acrolinx Sidebar SDK provides robust highlighting and scrolling functionality, but proper configuration is essential for it to work correctly with your specific editor and UI layout. 