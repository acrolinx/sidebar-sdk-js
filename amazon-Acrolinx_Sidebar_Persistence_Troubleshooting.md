# Acrolinx Sidebar SDK: Sidebar Persistence Troubleshooting Guide

## Overview

This guide addresses the issue where the Acrolinx Sidebar retains check results from previous articles when opened on new content. This is a common problem in CMS environments where the sidebar is reused across different articles or documents.

## Problem Description

**Symptom**: When a user closes the Acrolinx Sidebar after checking one article and then opens it again on a new article, the sidebar still displays the check results from the previous article instead of showing a clean state for the new content.

**Expected Behavior**: Each time the sidebar is opened on new content, it should start fresh without any previous check results.

## Root Causes and Solutions

### 1. Sidebar Instance Reuse

**Problem**: The same sidebar instance is being reused across different articles without proper cleanup.

**Solution**: Properly dispose of the sidebar instance when switching between articles.

```javascript
// Problem: Reusing the same plugin instance
let acrolinxPlugin = new AcrolinxPlugin(config);

// Solution: Dispose and recreate for each article
function switchToNewArticle() {
  // Dispose the current instance
  acrolinxPlugin.dispose(() => {
    console.log('Sidebar disposed successfully');
    
    // Create new instance for the new article
    acrolinxPlugin = new AcrolinxPlugin(config);
    const adapter = new ContentEditableAdapter({ element: editorElement });
    acrolinxPlugin.registerAdapter(adapter);
    acrolinxPlugin.init();
  });
}
```

### 2. Missing Sidebar Container Cleanup

**Problem**: The sidebar container is not properly cleared when switching articles.

**Solution**: Ensure complete cleanup of the sidebar container.

```javascript
// Problem: Incomplete cleanup
acrolinxPlugin.dispose(() => {
  // Container might still have stale content
});

// Solution: Complete container cleanup
acrolinxPlugin.dispose(() => {
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    // Clear all content including any hidden elements
    sidebarContainer.innerHTML = '';
    
    // Remove any event listeners or references
    sidebarContainer.replaceWith(sidebarContainer.cloneNode(true));
  }
});
```

### 3. Browser Cache and Iframe Persistence

**Problem**: The sidebar iframe retains state due to browser caching or iframe persistence.

**Solution**: Force iframe refresh and clear cache.

```javascript
// Problem: Iframe retains cached state
const iframe = document.querySelector('#sidebar-container iframe');

// Solution: Force iframe refresh with cache busting
function refreshSidebarIframe() {
  const iframe = document.querySelector('#sidebar-container iframe');
  if (iframe) {
    // Clear iframe content
    iframe.src = 'about:blank';
    
    // Force reload with cache busting
    setTimeout(() => {
      iframe.src = config.sidebarUrl + '?t=' + Date.now();
    }, 100);
  }
}
```

### 4. Local Storage Persistence

**Problem**: Sidebar state is persisted in localStorage and not cleared between articles.

**Solution**: Clear relevant localStorage entries.

```javascript
// Problem: Sidebar state persists in localStorage
// The SDK uses localStorage for position and other settings

// Solution: Clear sidebar-related localStorage
function clearSidebarStorage() {
  const keysToRemove = [
    'acrolinx.plugins.floatingSidebar.position',
    // Add other sidebar-related keys as needed
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
}

// Call this when switching articles
function switchArticle() {
  clearSidebarStorage();
  acrolinxPlugin.dispose(() => {
    // Reinitialize sidebar
  });
}
```

### 5. Sidebar URL Caching

**Problem**: The sidebar URL includes a timestamp for cache busting, but it might not be sufficient.

**Solution**: Ensure proper cache busting and URL management.

```javascript
// The SDK automatically adds timestamps to sidebar URLs
// But you can enhance this for your specific use case

function createFreshSidebarUrl(baseUrl) {
  const timestamp = Date.now();
  const randomParam = Math.random().toString(36).substring(7);
  return `${baseUrl}index.html?t=${timestamp}&r=${randomParam}`;
}

// Use this in your configuration
const config = {
  sidebarUrl: createFreshSidebarUrl('https://acrolinx-server.com/sidebar/'),
  // ... other config
};
```

## Implementation Patterns

### Pattern 1: Complete Sidebar Recreation

```javascript
class AcrolinxSidebarManager {
  constructor() {
    this.currentPlugin = null;
    this.config = {
      sidebarContainerId: 'acrolinx-sidebar',
      sidebarUrl: 'https://acrolinx-server.com/sidebar/',
      checkSelection: true
    };
  }

  async initializeSidebar(editorElement) {
    // Dispose existing sidebar if any
    if (this.currentPlugin) {
      await this.disposeSidebar();
    }

    // Create fresh sidebar instance
    this.currentPlugin = new AcrolinxPlugin(this.config);
    const adapter = new ContentEditableAdapter({ element: editorElement });
    this.currentPlugin.registerAdapter(adapter);
    await this.currentPlugin.init();
  }

  async disposeSidebar() {
    return new Promise((resolve) => {
      if (this.currentPlugin) {
        this.currentPlugin.dispose(() => {
          this.currentPlugin = null;
          this.clearSidebarStorage();
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  clearSidebarStorage() {
    // Clear all sidebar-related storage
    const sidebarKeys = Object.keys(localStorage).filter(key => 
      key.includes('acrolinx') || key.includes('sidebar')
    );
    sidebarKeys.forEach(key => localStorage.removeItem(key));
  }
}

// Usage
const sidebarManager = new AcrolinxSidebarManager();

// When switching to a new article
async function loadNewArticle(articleId) {
  const editorElement = document.getElementById('editor');
  await sidebarManager.initializeSidebar(editorElement);
}
```

### Pattern 2: Sidebar Container Isolation

```javascript
// Create isolated sidebar containers for each article
function createIsolatedSidebar(articleId) {
  // Remove existing sidebar containers
  const existingContainers = document.querySelectorAll('[id^="acrolinx-sidebar-"]');
  existingContainers.forEach(container => container.remove());

  // Create new isolated container
  const sidebarContainer = document.createElement('div');
  sidebarContainer.id = `acrolinx-sidebar-${articleId}`;
  document.body.appendChild(sidebarContainer);

  // Initialize sidebar with isolated container
  const config = {
    sidebarContainerId: sidebarContainer.id,
    sidebarUrl: 'https://acrolinx-server.com/sidebar/',
    checkSelection: true
  };

  const plugin = new AcrolinxPlugin(config);
  const adapter = new ContentEditableAdapter({ element: editorElement });
  plugin.registerAdapter(adapter);
  plugin.init();

  return plugin;
}
```

### Pattern 3: React Component Integration

```javascript
import React, { useEffect, useRef } from 'react';
import { AcrolinxPlugin, ContentEditableAdapter } from '@acrolinx/sidebar-sdk';

function AcrolinxSidebar({ articleId, editorElement }) {
  const pluginRef = useRef(null);

  useEffect(() => {
    // Cleanup previous sidebar
    if (pluginRef.current) {
      pluginRef.current.dispose(() => {
        console.log('Previous sidebar disposed');
      });
    }

    // Initialize new sidebar for this article
    const config = {
      sidebarContainerId: `sidebar-${articleId}`,
      sidebarUrl: 'https://acrolinx-server.com/sidebar/',
      checkSelection: true
    };

    const plugin = new AcrolinxPlugin(config);
    const adapter = new ContentEditableAdapter({ element: editorElement });
    plugin.registerAdapter(adapter);
    plugin.init();

    pluginRef.current = plugin;

    // Cleanup on unmount
    return () => {
      if (pluginRef.current) {
        pluginRef.current.dispose(() => {});
      }
    };
  }, [articleId, editorElement]);

  return <div id={`sidebar-${articleId}`} />;
}
```

## Debugging Steps

### 1. Check Sidebar State

```javascript
// Debug function to check sidebar state
function debugSidebarState() {
  console.log('=== Sidebar Debug Info ===');
  
  // Check iframe content
  const iframe = document.querySelector('#sidebar-container iframe');
  if (iframe) {
    console.log('Iframe src:', iframe.src);
    console.log('Iframe contentWindow:', iframe.contentWindow);
  }

  // Check localStorage
  const sidebarKeys = Object.keys(localStorage).filter(key => 
    key.includes('acrolinx') || key.includes('sidebar')
  );
  console.log('Sidebar localStorage keys:', sidebarKeys);

  // Check DOM elements
  const sidebarContainer = document.getElementById('sidebar-container');
  console.log('Sidebar container:', sidebarContainer);
  console.log('Container innerHTML length:', sidebarContainer?.innerHTML.length);
}
```

### 2. Monitor Sidebar Lifecycle

```javascript
// Add lifecycle monitoring
const originalDispose = AcrolinxPlugin.prototype.dispose;
AcrolinxPlugin.prototype.dispose = function(callback) {
  console.log('Disposing sidebar plugin...');
  originalDispose.call(this, () => {
    console.log('Sidebar plugin disposed successfully');
    callback();
  });
};
```

### 3. Verify Cleanup Completeness

```javascript
// Function to verify complete cleanup
function verifySidebarCleanup() {
  const checks = {
    iframeRemoved: !document.querySelector('#sidebar-container iframe'),
    containerEmpty: document.getElementById('sidebar-container')?.innerHTML === '',
    localStorageCleared: !Object.keys(localStorage).some(key => 
      key.includes('acrolinx') || key.includes('sidebar')
    )
  };

  console.log('Cleanup verification:', checks);
  return Object.values(checks).every(Boolean);
}
```

## Common CMS Integration Issues

### Custom CMS Integration

```javascript
// Generic CMS integration pattern
class CMSSidebarManager {
  constructor() {
    this.currentArticleId = null;
    this.plugin = null;
  }

  async switchArticle(newArticleId) {
    if (this.currentArticleId === newArticleId) {
      return; // Same article, no need to switch
    }

    // Dispose current sidebar
    if (this.plugin) {
      await this.disposeCurrentSidebar();
    }

    // Initialize sidebar for new article
    await this.initializeSidebarForArticle(newArticleId);
    this.currentArticleId = newArticleId;
  }

  async disposeCurrentSidebar() {
    return new Promise((resolve) => {
      if (this.plugin) {
        this.plugin.dispose(() => {
          this.plugin = null;
          this.clearAllSidebarData();
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  clearAllSidebarData() {
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('acrolinx') || key.includes('sidebar')) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('acrolinx') || key.includes('sidebar')) {
        sessionStorage.removeItem(key);
      }
    });

    // Clear DOM
    const containers = document.querySelectorAll('[id*="acrolinx"], [id*="sidebar"]');
    containers.forEach(container => {
      if (container.id.includes('acrolinx') || container.id.includes('sidebar')) {
        container.innerHTML = '';
      }
    });
  }
}
```

## Best Practices

### 1. Always Dispose Before Recreating

```javascript
// Good practice
async function switchArticle() {
  if (currentPlugin) {
    await new Promise(resolve => currentPlugin.dispose(resolve));
  }
  currentPlugin = new AcrolinxPlugin(config);
  // ... initialize
}

// Bad practice
function switchArticle() {
  currentPlugin = new AcrolinxPlugin(config); // Old instance not disposed
  // ... initialize
}
```

### 2. Use Unique Container IDs

```javascript
// Good practice
const containerId = `acrolinx-sidebar-${articleId}-${Date.now()}`;

// Bad practice
const containerId = 'acrolinx-sidebar'; // Same ID reused
```

### 3. Implement Proper Error Handling

```javascript
async function initializeSidebar() {
  try {
    await disposeCurrentSidebar();
    await createNewSidebar();
  } catch (error) {
    console.error('Failed to initialize sidebar:', error);
    // Implement fallback or retry logic
  }
}
```

### 4. Monitor Memory Usage

```javascript
// Monitor for memory leaks
function checkForMemoryLeaks() {
  const iframes = document.querySelectorAll('iframe');
  console.log('Number of iframes:', iframes.length);
  
  // Check for orphaned iframes
  iframes.forEach(iframe => {
    if (!iframe.parentNode) {
      console.warn('Orphaned iframe detected:', iframe);
    }
  });
}
```

## Testing Checklist

- [ ] Sidebar shows clean state when opened on new article
- [ ] Previous check results are not visible in new article
- [ ] Sidebar position resets to default on new article
- [ ] No console errors during article switching
- [ ] Memory usage doesn't increase with article switches
- [ ] Sidebar functionality works correctly on new article
- [ ] No orphaned DOM elements after switching
- [ ] localStorage is properly cleared between articles

## Conclusion

The key to solving sidebar persistence issues is ensuring complete cleanup of the previous sidebar instance before creating a new one. This includes:

1. **Proper disposal** of the AcrolinxPlugin instance
2. **Complete DOM cleanup** of sidebar containers
3. **Storage cleanup** of localStorage and sessionStorage
4. **Iframe refresh** to clear cached content
5. **Unique container IDs** to prevent conflicts

By following these patterns and implementing proper lifecycle management, you can ensure that each article gets a fresh sidebar experience without any residual state from previous checks. 