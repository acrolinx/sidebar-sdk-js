# Acrolinx Sidebar SDK: Document Name Display Troubleshooting Guide

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

This guide addresses the issue where the **document name is missing from the upper right corner** of the Acrolinx Scorecard. When a check is completed, the scorecard should display the document name (e.g., "multi-editor.html") in the upper right corner, but some integrations show an empty space instead.

## Problem Description

**Symptom**: The Acrolinx Scorecard displays correctly with check results, but the document name field in the upper right corner is empty or missing.

**Expected Behavior**: The document name should appear in the upper right corner of the scorecard, providing users with context about which document was checked.

**Root Cause**: The `documentReference` field is not being provided to the Acrolinx check request, so the sidebar has no document name to display.

## Understanding Document Reference

The document name displayed in the scorecard comes from the `documentReference` field in the check request. This field can be provided in three ways (in order of precedence):

1. **Adapter-level**: Through the adapter's `extractContentForCheck()` method
2. **Plugin-level**: Through the plugin configuration's `getDocumentReference()` function  
3. **Default fallback**: Uses `window.location.href` if neither above is provided

## Solutions

### Solution 1: Set Document Reference in Adapter (Recommended)

The most direct approach is to return the `documentReference` from your adapter's `extractContentForCheck()` method:

```javascript
import { AdapterInterface, ContentExtractionResult } from '@acrolinx/sidebar-sdk';

class CustomAdapter implements AdapterInterface {
  private documentName: string;

  constructor(element: HTMLElement, documentName: string) {
    this.element = element;
    this.documentName = documentName; // Store the document name
  }

  extractContentForCheck(opts: any): ContentExtractionResult {
    const content = this.getContent();
    
    return {
      content: content,
      documentReference: this.documentName, // Provide document name here
      selection: opts.checkSelection ? this.getSelection() : undefined
    };
  }

  // ... other required methods
}

// Usage
const adapter = new CustomAdapter(editorElement, 'my-article.html');
plugin.registerAdapter(adapter);
```

#### Dynamic Document Names

For applications with multiple documents or dynamic content:

```javascript
class DynamicDocumentAdapter implements AdapterInterface {
  constructor(private element: HTMLElement, private getDocumentName: () => string) {}

  extractContentForCheck(opts: any): ContentExtractionResult {
    const content = this.getContent();
    
    return {
      content: content,
      documentReference: this.getDocumentName(), // Dynamic document name
      selection: opts.checkSelection ? this.getSelection() : undefined
    };
  }
}

// Usage examples
const adapter = new DynamicDocumentAdapter(editorElement, () => {
  // Get document name from your application state
  return getCurrentDocumentName();
});

// Or from DOM
const adapter = new DynamicDocumentAdapter(editorElement, () => {
  return document.title || 'untitled-document.html';
});

// Or from URL
const adapter = new DynamicDocumentAdapter(editorElement, () => {
  return window.location.pathname.split('/').pop() || 'document.html';
});
```

### Solution 2: Set Document Reference in Plugin Configuration

Configure the document reference at the plugin level using the `getDocumentReference` function:

```javascript
import { AcrolinxPlugin } from '@acrolinx/sidebar-sdk';

const config = {
  sidebarContainerId: 'acrolinx-sidebar',
  sidebarUrl: 'https://customer-specific.acrolinx.cloud/sidebar/',
  checkSelection: true,
  
  // Provide document reference function
  getDocumentReference: () => {
    return getCurrentDocumentName(); // Your function to get document name
  }
};

const plugin = new AcrolinxPlugin(config);
```

#### Common Document Reference Patterns

```javascript
// Pattern 1: From page title
getDocumentReference: () => {
  return document.title || 'untitled-document.html';
}

// Pattern 2: From URL path
getDocumentReference: () => {
  const path = window.location.pathname;
  return path.split('/').pop() || 'document.html';
}

// Pattern 3: From meta tag
getDocumentReference: () => {
  const metaTitle = document.querySelector('meta[name="document-title"]');
  return metaTitle?.getAttribute('content') || 'document.html';
}

// Pattern 4: From application state
getDocumentReference: () => {
  return window.myApp?.currentDocument?.name || 'document.html';
}

// Pattern 5: From data attribute
getDocumentReference: () => {
  return document.body.dataset.documentName || 'document.html';
}
```

### Solution 3: CMS-Specific Implementations

#### WordPress Integration
```javascript
getDocumentReference: () => {
  // Get post title from WordPress
  const postTitle = document.querySelector('.entry-title, .post-title, h1.title');
  if (postTitle) {
    return postTitle.textContent.trim() + '.html';
  }
  return 'wordpress-post.html';
}
```

#### Drupal Integration
```javascript
getDocumentReference: () => {
  // Get node title from Drupal
  const nodeTitle = document.querySelector('.node-title, .page-title, h1.title');
  if (nodeTitle) {
    return nodeTitle.textContent.trim() + '.html';
  }
  return 'drupal-node.html';
}
```

#### Custom CMS Integration
```javascript
getDocumentReference: () => {
  // Get document name from your CMS API
  const documentId = window.location.pathname.split('/').pop();
  return `${documentId}.html`;
}
```

### Solution 4: Multi-Document Applications

For applications managing multiple documents simultaneously:

```javascript
class MultiDocumentManager {
  constructor() {
    this.documents = new Map(); // documentId -> { name, plugin, adapter }
  }

  createDocumentAdapter(documentId, documentName, editorElement) {
    const config = {
      sidebarContainerId: `sidebar-${documentId}`,
      sidebarUrl: 'https://customer-specific.acrolinx.cloud/sidebar/',
      checkSelection: true,
      getDocumentReference: () => documentName // Use specific document name
    };

    const plugin = new AcrolinxPlugin(config);
    const adapter = new ContentEditableAdapter({ element: editorElement });
    
    // Store document info
    this.documents.set(documentId, {
      name: documentName,
      plugin: plugin,
      adapter: adapter
    });

    plugin.registerAdapter(adapter);
    return plugin;
  }

  updateDocumentName(documentId, newName) {
    const doc = this.documents.get(documentId);
    if (doc) {
      doc.name = newName;
      // The getDocumentReference function will return the updated name
    }
  }
}

// Usage
const manager = new MultiDocumentManager();
const plugin = manager.createDocumentAdapter('doc1', 'article-1.html', editorElement);
```

## Implementation Examples

### Example 1: React Component Integration

```javascript
import React, { useEffect, useRef, useState } from 'react';
import { AcrolinxPlugin, ContentEditableAdapter } from '@acrolinx/sidebar-sdk';

function DocumentEditor({ documentName, content }) {
  const editorRef = useRef(null);
  const pluginRef = useRef(null);
  const [currentDocName, setCurrentDocName] = useState(documentName);

  useEffect(() => {
    if (editorRef.current) {
      const config = {
        sidebarContainerId: 'acrolinx-sidebar',
        sidebarUrl: 'https://customer-specific.acrolinx.cloud/sidebar/',
        checkSelection: true,
        getDocumentReference: () => currentDocName // Use current document name
      };

      const plugin = new AcrolinxPlugin(config);
      const adapter = new ContentEditableAdapter({ element: editorRef.current });
      
      plugin.registerAdapter(adapter);
      plugin.init();
      
      pluginRef.current = plugin;
    }

    return () => {
      if (pluginRef.current) {
        pluginRef.current.dispose(() => {});
      }
    };
  }, [currentDocName]);

  // Update document name when prop changes
  useEffect(() => {
    setCurrentDocName(documentName);
  }, [documentName]);

  return (
    <div>
      <div 
        ref={editorRef}
        contentEditable
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <div id="acrolinx-sidebar"></div>
    </div>
  );
}
```

### Example 2: Angular Service Integration

```typescript
import { Injectable } from '@angular/core';
import { AcrolinxPlugin, ContentEditableAdapter } from '@acrolinx/sidebar-sdk';

@Injectable({
  providedIn: 'root'
})
export class AcrolinxService {
  private plugin: AcrolinxPlugin | null = null;
  private currentDocumentName: string = 'document.html';

  initializeAcrolinx(editorElement: HTMLElement, documentName: string) {
    this.currentDocumentName = documentName;

    const config = {
      sidebarContainerId: 'acrolinx-sidebar',
      sidebarUrl: 'https://customer-specific.acrolinx.cloud/sidebar/',
      checkSelection: true,
      getDocumentReference: () => this.currentDocumentName
    };

    this.plugin = new AcrolinxPlugin(config);
    const adapter = new ContentEditableAdapter({ element: editorElement });
    
    this.plugin.registerAdapter(adapter);
    this.plugin.init();
  }

  updateDocumentName(newName: string) {
    this.currentDocumentName = newName;
    // The getDocumentReference function will return the updated name
  }

  dispose() {
    if (this.plugin) {
      this.plugin.dispose(() => {});
      this.plugin = null;
    }
  }
}
```

### Example 3: Vanilla JavaScript Implementation

```javascript
class DocumentNameManager {
  constructor() {
    this.currentDocumentName = 'document.html';
    this.plugin = null;
  }

  initialize(editorElement, initialDocumentName) {
    this.currentDocumentName = initialDocumentName;

    const config = {
      sidebarContainerId: 'acrolinx-sidebar',
      sidebarUrl: 'https://customer-specific.acrolinx.cloud/sidebar/',
      checkSelection: true,
      getDocumentReference: () => this.currentDocumentName
    };

    this.plugin = new AcrolinxPlugin(config);
    const adapter = new ContentEditableAdapter({ element: editorElement });
    
    this.plugin.registerAdapter(adapter);
    this.plugin.init();
  }

  updateDocumentName(newName) {
    this.currentDocumentName = newName;
    console.log(`Document name updated to: ${newName}`);
  }

  getDocumentName() {
    return this.currentDocumentName;
  }
}

// Usage
const manager = new DocumentNameManager();
const editorElement = document.getElementById('editor');
manager.initialize(editorElement, 'my-article.html');

// Update document name when needed
manager.updateDocumentName('updated-article.html');
```

## Common Patterns and Best Practices

### 1. File Extension Handling

```javascript
function normalizeDocumentName(name) {
  // Ensure the name has a proper extension
  if (!name.includes('.')) {
    return name + '.html';
  }
  return name;
}

getDocumentReference: () => {
  const baseName = getCurrentDocumentName();
  return normalizeDocumentName(baseName);
}
```

### 2. Sanitizing Document Names

```javascript
function sanitizeDocumentName(name) {
  // Remove invalid characters and normalize
  return name
    .replace(/[^a-zA-Z0-9\-_.]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

getDocumentReference: () => {
  const rawName = getCurrentDocumentName();
  return sanitizeDocumentName(rawName) + '.html';
}
```

### 3. Fallback Strategies

```javascript
function getDocumentNameWithFallback() {
  // Try multiple sources in order of preference
  const strategies = [
    () => document.querySelector('meta[name="document-title"]')?.content,
    () => document.title,
    () => window.location.pathname.split('/').pop(),
    () => 'untitled-document.html'
  ];

  for (const strategy of strategies) {
    try {
      const name = strategy();
      if (name && name.trim()) {
        return name.trim();
      }
    } catch (error) {
      console.warn('Document name strategy failed:', error);
    }
  }

  return 'document.html';
}
```

### 4. Dynamic Updates

```javascript
class DynamicDocumentNameAdapter extends ContentEditableAdapter {
  constructor(element, getDocumentName) {
    super({ element });
    this.getDocumentName = getDocumentName;
  }

  extractContentForCheck(opts) {
    const result = super.extractContentForCheck(opts);
    
    // Always use the latest document name
    if (typeof result === 'object' && result.content) {
      result.documentReference = this.getDocumentName();
    }
    
    return result;
  }
}
```

## Debugging Steps

### 1. Verify Document Reference is Being Set

```javascript
// Add logging to check if document reference is being provided
const originalExtractContentForCheck = adapter.extractContentForCheck;
adapter.extractContentForCheck = function(opts) {
  const result = originalExtractContentForCheck.call(this, opts);
  console.log('Document reference being sent:', result.documentReference);
  return result;
};
```

### 2. Check Plugin Configuration

```javascript
// Verify getDocumentReference function is working
const config = {
  // ... other config
  getDocumentReference: () => {
    const docName = getCurrentDocumentName();
    console.log('getDocumentReference called, returning:', docName);
    return docName;
  }
};
```

### 3. Monitor Check Requests

```javascript
// Add logging to monitor check requests
const originalRegisterCheckCall = adapter.registerCheckCall;
adapter.registerCheckCall = function(checkInfo) {
  console.log('Check request:', checkInfo);
  console.log('Document reference in request:', checkInfo.requestDescription?.documentReference);
  return originalRegisterCheckCall.call(this, checkInfo);
};
```

### 4. Inspect Network Requests

Open browser developer tools and check the network tab for the check request. Look for the `documentReference` field in the request payload:

```json
{
  "content": "...",
  "requestDescription": {
    "documentReference": "should-be-here.html"
  }
}
```

## Testing Checklist

- [ ] Document name appears in scorecard upper right corner
- [ ] Document name updates when switching between documents
- [ ] Document name handles special characters correctly
- [ ] Document name has appropriate file extension
- [ ] Document name fallback works when primary source fails
- [ ] Console shows correct document reference in check requests
- [ ] Network requests include documentReference field

## Troubleshooting Common Issues

### Issue 1: Document Name Still Missing

**Cause**: Both adapter and plugin-level document reference are undefined.

**Solution**: Add debugging to verify your document name source:

```javascript
function debugDocumentName() {
  console.log('=== Document Name Debug ===');
  console.log('document.title:', document.title);
  console.log('window.location.href:', window.location.href);
  console.log('Custom function result:', getCurrentDocumentName());
}

debugDocumentName();
```

### Issue 2: Document Name Shows as URL

**Cause**: No custom document reference provided, falling back to `window.location.href`.

**Solution**: Implement one of the solutions above to provide a proper document name.

### Issue 3: Document Name Not Updating

**Cause**: Document reference is cached or not being re-evaluated.

**Solution**: Ensure your document reference function is dynamic:

```javascript
// Wrong: Static value
getDocumentReference: () => 'static-name.html'

// Right: Dynamic evaluation
getDocumentReference: () => getCurrentDocumentName()
```

### Issue 4: Special Characters in Document Name

**Cause**: Document name contains characters that break display.

**Solution**: Sanitize the document name:

```javascript
getDocumentReference: () => {
  const rawName = getCurrentDocumentName();
  return sanitizeDocumentName(rawName);
}
```

## Best Practices Summary

1. **Always provide a document reference** - Either through adapter or plugin configuration
2. **Use dynamic functions** - Don't hardcode document names
3. **Implement fallbacks** - Handle cases where primary document name source fails
4. **Sanitize names** - Remove or replace invalid characters
5. **Add file extensions** - Ensure document names have appropriate extensions
6. **Test thoroughly** - Verify document names work across different scenarios
7. **Log for debugging** - Add console logging to track document reference values

## Conclusion

The document name in the Acrolinx Scorecard is controlled by the `documentReference` field in the check request. By implementing one of the solutions above, you can ensure that your integration displays meaningful document names that help users understand which document was checked.

**Key Takeaway**: The `documentReference` field is essential for providing context in the Acrolinx Scorecard. Always ensure this field is populated with a meaningful document name through either the adapter's `extractContentForCheck()` method or the plugin's `getDocumentReference()` configuration function. 