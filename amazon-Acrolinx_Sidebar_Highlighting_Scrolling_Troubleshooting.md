# Acrolinx Sidebar SDK: Highlighting and Scrolling Troubleshooting Guide

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

When building a custom adapter, you must implement the `AdapterInterface` or `AsyncAdapterInterface`. Here are the critical methods for highlighting and scrolling:

```javascript
import { AdapterInterface, Match, MatchWithReplacement } from '@acrolinx/sidebar-sdk';

class CustomEditorAdapter implements AdapterInterface {
  constructor(private element: HTMLElement, private config: any) {}

  // Required for highlighting - select ranges in your editor
  selectRanges(checkId: string, matches: Match[]): void {
    // 1. Find the text positions in your editor
    const alignedMatches = this.lookupMatches(matches);
    
    // 2. Create selection in your editor
    this.createSelection(alignedMatches);
    
    // 3. Scroll to the selection
    this.scrollToSelection();
  }

  // Required for text replacement
  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): void {
    // 1. Select the ranges to replace
    this.selectRanges(checkId, matchesWithReplacement);
    
    // 2. Perform the replacement in your editor
    this.performReplacement(matchesWithReplacement);
    
    // 3. Restore selection and scroll
    this.restoreSelectionAfterReplacement(matchesWithReplacement);
  }

  // Critical for scrolling - implement proper scrolling logic
  private scrollToSelection(): void {
    const selection = this.getCurrentSelection();
    if (!selection) return;

    // Get the element containing the selection
    const selectedElement = this.getSelectedElement(selection);
    
    // Use the SDK's scrolling utilities
    import { scrollIntoViewCenteredWithFallback } from '@acrolinx/sidebar-sdk';
    scrollIntoViewCenteredWithFallback(selectedElement);
  }

  // Helper method to get current selection
  private getCurrentSelection(): any {
    // Implement based on your editor's API
    // Example for a custom editor:
    return this.editor.getSelection();
  }

  // Helper method to get element containing selection
  private getSelectedElement(selection: any): HTMLElement {
    // Implement based on your editor's API
    // Example for a custom editor:
    const range = selection.getRange();
    return range.startContainer.parentElement;
  }

  // Required interface methods
  extractContentForCheck(opts: any): any {
    // Return content from your editor
    return {
      content: this.editor.getContent(),
      selection: opts.checkSelection ? this.getSelection() : undefined
    };
  }

  registerCheckCall(checkInfo: any): void {
    // Store check information if needed
    this.currentCheck = checkInfo;
  }

  registerCheckResult(checkResult: any): void {
    // Handle check results
    this.lastCheckResult = checkResult;
  }
}
```

### Common Custom Adapter Issues

#### Missing Selection Implementation
```javascript
// Problem: selectRanges not implemented or incomplete
selectRanges(checkId: string, matches: Match[]): void {
  // Missing implementation
}

// Solution: Implement proper selection
selectRanges(checkId: string, matches: Match[]): void {
  // 1. Map matches to editor positions
  const editorMatches = this.mapMatchesToEditor(matches);
  
  // 2. Create selection in editor
  this.editor.setSelection(editorMatches[0].start, editorMatches[0].end);
  
  // 3. Scroll to selection
  this.scrollToSelection();
}
```

#### Incorrect Scrolling Implementation
```javascript
// Problem: Using basic scrollIntoView without offset
private scrollToSelection(): void {
  const element = this.getSelectedElement();
  element.scrollIntoView(); // No offset consideration
}

// Solution: Use SDK scrolling with proper offset
private scrollToSelection(): void {
  const element = this.getSelectedElement();
  import { scrollIntoView } from '@acrolinx/sidebar-sdk';
  scrollIntoView(element, this.config.scrollOffsetY || 0);
}
```

#### Text Position Mapping Issues
```javascript
// Problem: Incorrect text position mapping
private mapMatchesToEditor(matches: Match[]): any[] {
  // Simple character count mapping (often incorrect)
  return matches.map(match => ({
    start: match.range[0],
    end: match.range[1]
  }));
}

// Solution: Use SDK's text mapping utilities
private mapMatchesToEditor(matches: Match[]): any[] {
  import { lookupMatches, extractTextDomMapping } from '@acrolinx/sidebar-sdk';
  
  const textMapping = extractTextDomMapping(this.element);
  const alignedMatches = lookupMatches(
    this.lastContentChecked, 
    textMapping.text, 
    matches
  );
  
  return alignedMatches.map(match => ({
    start: match.range[0],
    end: match.range[1],
    originalMatch: match.originalMatch
  }));
}
```

### Custom Adapter Best Practices

#### 1. Implement Proper Error Handling
```javascript
selectRanges(checkId: string, matches: Match[]): void {
  try {
    // Your selection logic
    this.performSelection(matches);
    this.scrollToSelection();
  } catch (error) {
    console.error('Failed to select ranges:', error);
    // Fallback behavior
    this.fallbackSelection(matches);
  }
}
```

#### 2. Handle Async Operations
```javascript
// For editors with async operations
class AsyncCustomAdapter implements AsyncAdapterInterface {
  readonly isAsync = true;
  readonly requiresSynchronization = true;

  async selectRanges(checkId: string, matches: Match[]): Promise<void> {
    // Wait for editor to be ready
    await this.editor.ready();
    
    // Perform selection
    await this.performAsyncSelection(matches);
    
    // Scroll to selection
    await this.scrollToSelection();
  }
}
```

#### 3. Test Your Custom Adapter
```javascript
// Test selection and scrolling
function testCustomAdapter(adapter: CustomEditorAdapter) {
  // Test with simple content
  adapter.editor.setContent('This is a test sentence.');
  
  // Test selection
  const testMatches = [{
    range: [5, 7], // "is"
    content: 'is',
    replacement: 'was'
  }];
  
  adapter.selectRanges('test', testMatches);
  
  // Verify selection is visible
  const selectedText = adapter.editor.getSelectedText();
  console.log('Selected text:', selectedText);
  
  // Verify scrolling worked
  const isVisible = adapter.isSelectionVisible();
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

- **Scroll offset is critical** - Always configure `scrollOffsetY`
- **Selection checking must be enabled** - Set `checkSelection: true`
- **Container must be scrollable** - Use proper CSS overflow
- **Use appropriate adapter** - Match adapter to editor type
- **Test browser compatibility** - Modern scrolling isn't universal
- **Monitor console errors** - SDK provides helpful error messages

Remember: The Acrolinx Sidebar SDK provides robust highlighting and scrolling functionality, but proper configuration is essential for it to work correctly with your specific editor and UI layout. 