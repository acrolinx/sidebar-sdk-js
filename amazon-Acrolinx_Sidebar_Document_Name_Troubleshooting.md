# Acrolinx Sidebar SDK-JS: Document Name Display And Proper Article Path Resource Troubleshooting Guide

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

This guide addresses the issue where the **document name is missing from the upper right corner** of the Acrolinx Scorecard. When a check is completed, the scorecard should display the document name (e.g., "multi-editor.html") in the upper right corner, but some custom Sidebar JS SDK integrations show an empty space instead.

## Problem Description

The customer's file reference issue consists of **two distinct but related sub-issues**:

### Sub-Issue 1: Missing Document Name Display

**Symptom**: The Acrolinx Scorecard displays correctly with check results, but the document name field in the upper right corner is empty or missing.

**Expected Behavior**: The document name should appear in the upper right corner of the scorecard, providing users with context about which document was checked.

**Root Cause**: The `documentReference` field is not being provided to the Acrolinx check request, so the sidebar has no document name to display.

**Impact**: Users lose context about which document was checked, making it difficult to track and manage multiple documents or return to specific content.

### Sub-Issue 2: Hash Characters in File Reference Path

**Symptom**: When `documentReference` defaults to `window.location.href`, the full URL with hash fragments is used as the file reference, resulting in unwieldy references like:
```
http://localhost:8000/#/oan/topic/amzn.gcs.id.collectionId.sourceCollection.format.sourceFormat.locale.sourceLocale.topicId.TZfGQTd2yaqcesSUlH
```

**Expected Behavior**: The file reference should be a clean, meaningful document name like:
```
topic-TZfGQTd2yaqcesSUlH.html
```

**Root Cause**: Hash-based routing URLs (Single Page Applications) break the default document name extraction logic, causing the entire URL to be used instead of extracting meaningful identifiers.

**Impact**: 
- **Poor User Experience**: Extremely long, technical URLs are displayed instead of user-friendly document names
- **Reduced Usability**: Users cannot easily identify or distinguish between different documents
- **Professional Appearance**: Technical URLs make the interface appear unpolished and confusing

### Combined Impact

When both sub-issues occur together:
1. **No document name appears** (Sub-Issue 1), OR
2. **Full technical URL appears** instead of clean document name (Sub-Issue 2)

Both scenarios result in poor user experience and reduced context for content management.

## Understanding Document Reference

**Source**: This information is based on official Acrolinx SDK documentation and codebase analysis.

The document name displayed in the scorecard comes from the `documentReference` field in the check request. This field can be provided in three ways (in order of precedence):

1. **Adapter-level**: Through the adapter's `extractContentForCheck()` method ([AdapterInterface.ts](https://github.com/acrolinx/sidebar-sdk-js/blob/57c3d243d8c6e1360a6ad5b283bafc38dab67def/src/adapters/AdapterInterface.ts#L49))
2. **Plugin-level**: Through the plugin configuration's `getDocumentReference()` function ([acrolinx-plugin.ts](https://github.com/acrolinx/sidebar-sdk-js/blob/57c3d243d8c6e1360a6ad5b283bafc38dab67def/src/acrolinx-plugin.ts#L60))
3. **Default fallback**: Uses `window.location.href` if neither above is provided

## Solutions

### Solution 1: Set Document Reference in Adapter (Recommended)

**Source**: Based on official Acrolinx SDK AdapterInterface specification.

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

**Source**: Based on official Acrolinx SDK AcrolinxPluginConfig specification.

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


#### Custom CMS Integration
```javascript
getDocumentReference: () => {
  // Get document name from your CMS API
  const documentId = window.location.pathname.split('/').pop();
  return `${documentId}.html`;
}
```

### Solution 4: Single Page Applications (SPAs) with Hash Routing

**Source**: Based on Acrolinx integration experience and UAT testing analysis of hash URL issues.

For SPAs using hash-based routing (like Angular, React Router hash mode):

```javascript
class SPADocumentNameExtractor {
  constructor() {
    this.routePatterns = {
      // Define patterns for your SPA routes
      topic: /topicId\.([^./?]+)/,
      article: /articleId\.([^./?]+)/,
      document: /documentId\.([^./?]+)/,
      // Add more patterns as needed
    };
  }

  extractFromHash() {
    const hash = window.location.hash;
    if (!hash || !hash.includes('#/')) {
      return null;
    }

    const hashPath = hash.substring(2); // Remove '#/'
    console.log('Parsing hash path:', hashPath);

    // Try each pattern
    for (const [type, pattern] of Object.entries(this.routePatterns)) {
      const match = hashPath.match(pattern);
      if (match) {
        const id = match[1];
        console.log(`Found ${type} ID:`, id);
        return `${type}-${id}.html`;
      }
    }

    // Fallback: use last meaningful segment
    const segments = hashPath.split('/').filter(segment => 
      segment && segment.length > 2 && !segment.includes('.')
    );

    if (segments.length > 0) {
      return `${segments[segments.length - 1]}.html`;
    }

    return 'spa-document.html';
  }

  getDocumentName() {
    // Try hash extraction first
    const hashName = this.extractFromHash();
    if (hashName) {
      return hashName;
    }

    // Fallback to title or pathname
    if (document.title && document.title !== 'Document') {
      return document.title.replace(/[^a-zA-Z0-9\-_.]/g, '-') + '.html';
    }

    const pathName = window.location.pathname;
    return pathName.split('/').pop() || 'document.html';
  }
}

// Usage for customer's specific URL pattern
const spaExtractor = new SPADocumentNameExtractor();

const config = {
  sidebarContainerId: 'acrolinx-sidebar',
  sidebarUrl: 'https://customer-specific.acrolinx.cloud/sidebar/',
  checkSelection: true,
  getDocumentReference: () => spaExtractor.getDocumentName()
};
```

**Customer-Specific Implementation** (for the exact URL pattern shown):

**Source**: Based on customer UAT testing feedback and hash URL analysis.

```javascript
function extractAmazonDocumentName() {
  const url = window.location.href;
  
  // Handle the specific Amazon URL pattern
  // http://localhost:8000/#/oan/topic/amzn.gcs.id.collectionId.sourceCollection.format.sourceFormat.locale.sourceLocale.topicId.TZfGQTd2yaqcesSUlH
  
  if (url.includes('#/oan/topic/')) {
    const hashPart = url.split('#/oan/topic/')[1];
    
    // Extract topicId (the last segment after the last dot)
    const topicIdMatch = hashPart.match(/topicId\.([^./?#]+)$/);
    if (topicIdMatch) {
      const topicId = topicIdMatch[1];
      return `topic-${topicId}.html`;
    }
    
    // Fallback: extract any meaningful identifier
    const segments = hashPart.split('.');
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && lastSegment.length > 3) {
      return `document-${lastSegment}.html`;
    }
  }
  
  // General hash routing fallback
  if (url.includes('#/')) {
    const hashPart = url.split('#/')[1];
    const pathSegments = hashPart.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    if (lastSegment && lastSegment.length > 3) {
      return `${lastSegment}.html`;
    }
  }
  
  return 'amazon-document.html';
}

// Use in plugin configuration
const config = {
  sidebarContainerId: 'acrolinx-sidebar',
  sidebarUrl: 'https://customer-specific.acrolinx.cloud/sidebar/',
  checkSelection: true,
  getDocumentReference: extractAmazonDocumentName
};
```

### Solution 5: Multi-Document Applications

**Source**: Based on Acrolinx integration experience and multi-document management patterns.

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

**Note**: The following examples demonstrate supplementary integration patterns for common frameworks. These are not part of the official Acrolinx SDK documentation but are provided as helpful implementation guidance based on integration experience.

### Example 1: React Component Integration (Supplementary Pattern)

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

### Example 2: Angular Service Integration (Supplementary Pattern)

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

### Example 3: Vanilla JavaScript Implementation (Core SDK Pattern)

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

**Source**: Based on Acrolinx integration experience and best practices recommendations.

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

### 4. Debug Hash-Based URLs

For SPAs with hash routing, add specific debugging:

```javascript
function debugHashBasedUrl() {
  console.log('=== Hash URL Debug ===');
  console.log('Full URL:', window.location.href);
  console.log('Hash:', window.location.hash);
  console.log('Pathname:', window.location.pathname);
  
  if (window.location.hash.includes('#/')) {
    const hashPart = window.location.hash.substring(2);
    console.log('Hash path:', hashPart);
    
    // Test topicId extraction
    const topicIdMatch = hashPart.match(/topicId\.([^./?#]+)/);
    if (topicIdMatch) {
      console.log('Extracted topicId:', topicIdMatch[1]);
    }
    
    // Test segment extraction
    const segments = hashPart.split('/');
    console.log('URL segments:', segments);
    
    // Test the customer's specific pattern
    if (hashPart.includes('oan/topic/')) {
      const topicPart = hashPart.split('oan/topic/')[1];
      console.log('Topic part:', topicPart);
      
      const dotSegments = topicPart.split('.');
      console.log('Dot segments:', dotSegments);
      console.log('Last segment:', dotSegments[dotSegments.length - 1]);
    }
  }
}

// Run this in browser console
debugHashBasedUrl();
```

### 5. Inspect Network Requests

Open browser developer tools and check the network tab for the check request. Look for the `documentReference` field in the request payload:

```json
{
  "content": "...",
  "requestDescription": {
    "documentReference": "should-be-here.html"
  }
}
```

**Expected vs Actual**:
```javascript
// Customer's problematic URL should produce:
// documentReference: "topic-TZfGQTd2yaqcesSUlH.html"

// Instead of:
// documentReference: "http://localhost:8000/#/oan/topic/amzn.gcs.id.collectionId.sourceCollection.format.sourceFormat.locale.sourceLocale.topicId.TZfGQTd2yaqcesSUlH"
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

This section provides specific troubleshooting guidance for each sub-issue identified in the Problem Description.

### Issue 1: Sub-Issue 1 - Missing Document Name Display

**Cause**: Both adapter-level and plugin-level document reference are undefined, causing the document name field to appear empty.

**Diagnosis**: Check if `documentReference` is being provided in either location:
- Adapter's `extractContentForCheck()` method
- Plugin's `getDocumentReference()` function

**Solution**: Implement one of Solutions 1 or 2 to provide document reference.

**Quick Fix**:
```javascript
// Add to plugin configuration
const config = {
  sidebarContainerId: 'acrolinx-sidebar',
  sidebarUrl: 'https://customer-specific.acrolinx.cloud/sidebar/',
  checkSelection: true,
  getDocumentReference: () => {
    return document.title || 'document.html';
  }
};
```

### Issue 2: Sub-Issue 2 - Hash Characters in File Reference Path

**Cause**: URLs with hash fragments (like `http://localhost:8000/#/oan/topic/...`) prevent proper document name extraction when using default `window.location.href` fallback.

**Diagnosis**: Check if your application uses hash-based routing and the document reference shows the full URL instead of a clean name.

**Example Problem**:
```
Customer URL: http://localhost:8000/#/oan/topic/amzn.gcs.id.collectionId.sourceCollection.format.sourceFormat.locale.sourceLocale.topicId.TZfGQTd2yaqcesSUlH
Working URL: http://localhost:3000/samples/multi-editor.html
```

**Solution**: Implement Solution 4 (SPA Hash Routing) to extract meaningful document names from hash-based URLs.

**Quick Fix for Customer's Specific Pattern**:
```javascript
function extractAmazonDocumentName() {
  const url = window.location.href;
  
  if (url.includes('#/oan/topic/')) {
    const hashPart = url.split('#/oan/topic/')[1];
    const topicIdMatch = hashPart.match(/topicId\.([^./?#]+)$/);
    if (topicIdMatch) {
      return `topic-${topicIdMatch[1]}.html`;
    }
  }
  
  return 'amazon-document.html';
}

// Use in plugin configuration
const config = {
  sidebarContainerId: 'acrolinx-sidebar',
  sidebarUrl: 'https://customer-specific.acrolinx.cloud/sidebar/',
  checkSelection: true,
  getDocumentReference: extractAmazonDocumentName
};
```

### Issue 3: Document Name Shows as Full URL (Related to Sub-Issue 2)

**Cause**: No custom document reference provided, falling back to `window.location.href` which includes hash fragments.

**Solution**: Implement any of Solutions 1-4 to provide a proper document name instead of relying on URL fallback.

### Issue 4: Document Name Not Updating

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

## Key Takeaways

The customer's file reference issue consists of two distinct sub-issues that require different solutions:

### Sub-Issue 1: Missing Document Name Display
1. **Always Provide Document Reference**: The `documentReference` field is essential for providing context in the Acrolinx Scorecard. Always ensure this field is populated with a meaningful document name through either the adapter's `extractContentForCheck()` method or the plugin's `getDocumentReference()` configuration function.

2. **Impact**: When missing, users lose context about which document was checked, making it difficult to track and manage multiple documents.

### Sub-Issue 2: Hash Characters in File Reference Path
3. **Hash URLs Break Default Extraction**: Single Page Applications (SPAs) using hash-based routing (like `#/path/to/resource`) prevent the default `window.location.href` fallback from extracting meaningful document names.

4. **Custom Extraction Required**: For hash-based URLs, you must implement custom document name extraction logic that parses the hash fragment to extract meaningful identifiers.

5. **Specific Pattern Matching**: The customer's URL pattern `#/oan/topic/amzn.gcs.id...topicId.TZfGQTd2yaqcesSUlH` requires specific regex matching to extract the `topicId` value.

6. **Impact**: Without proper extraction, extremely long technical URLs are displayed instead of user-friendly document names, resulting in poor user experience and reduced usability.

### Combined Solution
**Critical Fix for Hash-Based URLs**: Implement the `extractAmazonDocumentName()` function provided in Solution 4 to properly extract document names from hash-based routing URLs. This addresses both sub-issues by ensuring a meaningful document name is provided and properly extracted from hash URLs. 