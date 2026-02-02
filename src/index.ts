/* eslint-disable @typescript-eslint/no-explicit-any */

/*
 * Copyright 2018-present Acrolinx GmbH
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

// ============================================================================
// Core Plugin
// ============================================================================
export { AcrolinxPlugin } from './acrolinx-plugin';
export type { AcrolinxPluginConfig } from './acrolinx-plugin-config';

// ============================================================================
// Autobind Plugin
// ============================================================================
export { autoBindFloatingSidebar, autoBindFloatingSidebarAsync } from './autobind-plugin';
export type { AutoBindFloatingSidebarConfig } from './autobind-plugin';

// ============================================================================
// Adapters - Main Classes
// ============================================================================
export { InputAdapter } from './adapters/InputAdapter';
export { ContentEditableAdapter } from './adapters/ContentEditableAdapter';
export { HerettoContentEditableAdapter, isHeretto } from './adapters/HerettoContentEditableAdapter';
export { AsyncContentEditableAdapter as StateBasedContentEditableAdapter } from './adapters/AsyncContentEditableAdapter';
export { AbstractRichtextEditorAdapter } from './adapters/AbstractRichtextEditorAdapter';
export { CKEditor5Adapter } from './adapters/CKEditor5Adapter';
export { CKEditor4Adapter as CKEditorAdapter } from './adapters/CKEditor4Adapter';
export { TinyMCEAdapter } from './adapters/TinyMCEAdapter';
export { AutoBindAdapter } from './adapters/AutoBindAdapter';
export { AsyncAutoBindAdapter } from './adapters/AsyncAutoBindAdapter';
export { MultiEditorAdapter } from './adapters/MultiEditorAdapter';
export type { MultiEditorAdapterConfig } from './adapters/MultiEditorAdapter';
export { AsyncMultiEditorAdapter } from './adapters/AsyncMultiEditorAdapter';
export { CodeMirror6Adapter } from './adapters/CodeMirror6Adapter';
export { CodeMirror5Adapter as CodeMirrorAdapter } from './adapters/CodeMirror5Adapter';
export { XeditorAdapter } from './adapters/XeditorAdapter';
export { QuipAdapter } from './adapters/QuipAdapter';
export { SynchronizeAsyncAdapter } from './adapters/SynchronizeAsyncAdapter';

// ============================================================================
// Adapter Interfaces and Types
// ============================================================================
export type {
  AdapterInterface,
  AsyncAdapterInterface,
  CommonAdapterInterface,
  AdapterConf,
  CommonAdapterConf,
  HasEditorID,
  HasElement,
  SuccessfulContentExtractionResult,
  ContentExtractionResult,
  ExtractContentForCheckOpts,
  SuccessfulCheckResult,
  AutobindWrapperAttributes,
  HasError,
} from './adapters/AdapterInterface';

export {
  isAsyncAdapterInterface,
  hasError,
  isSuccessfulContentExtractionResult,
  hasEditorID,
  hasElement,
  getElementFromAdapterConf,
} from './adapters/AdapterInterface';

// ============================================================================
// Autobind Utilities
// ============================================================================
export type { AutobindConfig } from './autobind/autobind';
export {
  EDITABLE_ELEMENTS_SELECTOR,
  isProbablyUndesiredField,
  getEditableElements,
  bindAdaptersForCurrentPage,
} from './autobind/autobind';

// ============================================================================
// Message Adapter
// ============================================================================
export { createPluginMessageAdapter, connectAcrolinxPluginToMessages } from './message-adapter/message-adapter';

// ============================================================================
// Floating Sidebar
// ============================================================================
export { initFloatingSidebar } from './floating-sidebar/floating-sidebar';
export type {
  FloatingSidebar,
  FloatingSidebarConfig,
  Position,
  PositionUpdate,
} from './floating-sidebar/floating-sidebar';
export {
  SIDEBAR_ID,
  TITLE_BAR_CLASS,
  CLOSE_ICON_CLASS,
  SIDEBAR_CONTAINER_ID,
  SIDEBAR_DRAG_OVERLAY_ID,
  SIDEBAR_GLASS_PANE_ID,
  FOOTER,
  RESIZE_ICON_CLASS,
  IS_RESIZING_CLASS,
  IS_DRAGGED_CLASS,
  FOOTER_HEIGHT,
  DEFAULT_POS,
  POSITION_KEY,
  loadInitialPos,
  keepVisible,
} from './floating-sidebar/floating-sidebar';

// ============================================================================
// Async Storage
// ============================================================================
export { AsyncLocalStorage } from './floating-sidebar/async-storage';
export type { AsyncStorage } from './floating-sidebar/async-storage';
export { loadFromLocalStorage, saveToLocalStorage } from './floating-sidebar/async-storage';

// ============================================================================
// Lookup / Diff-Based
// ============================================================================
export { lookupMatches, createOffsetMappingArray } from './lookup/diff-based';
export type { InputFormat } from './lookup/diff-based';

// ============================================================================
// Utils - Alignment
// ============================================================================
export type { OffSetAlign, AlignedMatch } from './utils/alignment';
export { findDisplacement, findNewIndex, sortedIndexBy } from './utils/alignment';

// ============================================================================
// Utils - Text DOM Mapping
// ============================================================================
export { extractTextDomMapping } from './utils/text-dom-mapping';
export type { TextDomMapping, DomPosition } from './utils/text-dom-mapping';
export { textMapping, concatTextMappings, domPosition, getEndDomPos } from './utils/text-dom-mapping';

// ============================================================================
// Utils - Text Extraction
// ============================================================================
export { NEW_LINE_TAGS, AUTO_SELF_CLOSING_LINE_TAGS, extractText } from './utils/text-extraction';

// ============================================================================
// Utils - Check Selection
// ============================================================================
export { getSelectionHtmlRanges } from './utils/check-selection';

// ============================================================================
// Utils - Sidebar Loader
// ============================================================================
export { loadSidebarCode } from './utils/sidebar-loader';
export {
  SidebarURLInvalidError,
  grepAttributeValues,
  rebaseRelativeUrl,
  rebaseRelativeUrls,
} from './utils/sidebar-loader';

// ============================================================================
// Utils - Scrolling
// ============================================================================
export {
  scrollIntoView,
  scrollIntoViewCenteredIfPossible,
  scrollIntoViewCenteredWithFallback,
} from './utils/scrolling';

// ============================================================================
// Utils - Match
// ============================================================================
export { getCompleteFlagLength, rangeContent, isDangerousToReplace } from './utils/match';

// ============================================================================
// Utils - Adapter Utils
// ============================================================================
export { getAutobindWrapperAttributes } from './utils/adapter-utils';

// ============================================================================
// Utils - Logging
// ============================================================================
export { log, enableLogging } from './utils/logging';

// ============================================================================
// Utils - Browser Detection
// ============================================================================
export { browser, isChrome } from './utils/detect-browser';
export type { DetectedBrowser } from './utils/detect-browser';

// ============================================================================
// Utils - General Utilities
// ============================================================================
export type { SimulateInputEventProps } from './utils/utils';
export {
  logTime,
  internalFetch,
  isIFrame,
  simulateInputEvent,
  parseUrl,
  isFromSameOrigin,
  toSet,
  assign,
  deepFreezed,
  isDisplayed,
  assertElementIsDisplayed,
  containsText,
  removeNode,
  isPromise,
  Deferred,
  waitMs,
  deepCloneWithHTMLElement,
} from './utils/utils';

// ============================================================================
// Utils - Escaping
// ============================================================================
export { escapeHtmlCharacters } from './utils/escaping';
export type { EscapeHtmlCharactersResult } from './utils/escaping';

// ============================================================================
// Utils - Work Queue
// ============================================================================
export { WorkQueue } from './utils/work-queue';
export type { PromiseProvider } from './utils/work-queue';

// ============================================================================
// Constants
// ============================================================================
export { CLIENT_COMPONENT_MAIN_FALLBACK, SIDEBAR_SDK_COMPONENT } from './constants';

// ============================================================================
// Imports for Global Window Object
// ============================================================================
import { AcrolinxPlugin } from './acrolinx-plugin';
import { autoBindFloatingSidebar, autoBindFloatingSidebarAsync } from './autobind-plugin';
import { InputAdapter } from './adapters/InputAdapter';
import { ContentEditableAdapter } from './adapters/ContentEditableAdapter';
import { HerettoContentEditableAdapter } from './adapters/HerettoContentEditableAdapter';
import { AsyncContentEditableAdapter } from './adapters/AsyncContentEditableAdapter';
import { AbstractRichtextEditorAdapter } from './adapters/AbstractRichtextEditorAdapter';
import { CKEditor5Adapter } from './adapters/CKEditor5Adapter';
import { CKEditor4Adapter } from './adapters/CKEditor4Adapter';
import { TinyMCEAdapter } from './adapters/TinyMCEAdapter';
import { AutoBindAdapter } from './adapters/AutoBindAdapter';
import { AsyncAutoBindAdapter } from './adapters/AsyncAutoBindAdapter';
import { MultiEditorAdapter } from './adapters/MultiEditorAdapter';
import { AsyncMultiEditorAdapter } from './adapters/AsyncMultiEditorAdapter';
import { CodeMirror6Adapter } from './adapters/CodeMirror6Adapter';
import { CodeMirror5Adapter } from './adapters/CodeMirror5Adapter';
import { XeditorAdapter } from './adapters/XeditorAdapter';
import { QuipAdapter } from './adapters/QuipAdapter';
import { SynchronizeAsyncAdapter } from './adapters/SynchronizeAsyncAdapter';
import { createPluginMessageAdapter } from './message-adapter/message-adapter';
import { loadSidebarCode } from './utils/sidebar-loader';
import { getSelectionHtmlRanges } from './utils/check-selection';
import { lookupMatches } from './lookup/diff-based';
import { extractTextDomMapping } from './utils/text-dom-mapping';
import { initFloatingSidebar } from './floating-sidebar/floating-sidebar';
import { AsyncLocalStorage } from './floating-sidebar/async-storage';

export interface AcrolinxSidebarIntegration {
  AcrolinxPlugin: typeof AcrolinxPlugin;
  autoBindFloatingSidebar: typeof autoBindFloatingSidebar;
  autoBindFloatingSidebarAsync: typeof autoBindFloatingSidebarAsync;
  initFloatingSidebar: typeof initFloatingSidebar;
  AsyncLocalStorage: typeof AsyncLocalStorage;
  createPluginMessageAdapter: typeof createPluginMessageAdapter;
  loadSidebarCode: typeof loadSidebarCode;
  getSelectionHtmlRanges: typeof getSelectionHtmlRanges;
  extractTextDomMapping: typeof extractTextDomMapping;
  adapter: {
    AbstractRichtextEditorAdapter: typeof AbstractRichtextEditorAdapter;
    AutoBindAdapter: typeof AutoBindAdapter;
    AsyncAutoBindAdapter: typeof AsyncAutoBindAdapter;
    CKEditor5Adapter: typeof CKEditor5Adapter;
    CKEditorAdapter: typeof CKEditor4Adapter;
    CodeMirror6Adapter: typeof CodeMirror6Adapter;
    CodeMirrorAdapter: typeof CodeMirror5Adapter;
    ContentEditableAdapter: typeof ContentEditableAdapter;
    HerettoContentEditableAdapter: typeof HerettoContentEditableAdapter;
    AsyncContentEditableAdapter: typeof AsyncContentEditableAdapter;
    InputAdapter: typeof InputAdapter;
    MultiEditorAdapter: typeof MultiEditorAdapter;
    AsyncMultiEditorAdapter: typeof AsyncMultiEditorAdapter;
    TinyMCEAdapter: typeof TinyMCEAdapter;
    XeditorAdapter: typeof XeditorAdapter;
    QuipAdapter: typeof QuipAdapter;
    SynchronizeAsyncAdapter: typeof SynchronizeAsyncAdapter;
  };
  lookup: {
    lookupMatches: typeof lookupMatches;
  };
}

declare global {
  const acrolinx: {
    plugins: AcrolinxSidebarIntegration;
  };
}

const augmentedWindow = globalThis as any;

augmentedWindow.acrolinx = augmentedWindow.acrolinx || ({} as any);

const exported: AcrolinxSidebarIntegration = {
  AcrolinxPlugin: AcrolinxPlugin,
  autoBindFloatingSidebar: autoBindFloatingSidebar,
  autoBindFloatingSidebarAsync: autoBindFloatingSidebarAsync,
  createPluginMessageAdapter: createPluginMessageAdapter,
  initFloatingSidebar: initFloatingSidebar,
  AsyncLocalStorage: AsyncLocalStorage,
  loadSidebarCode: loadSidebarCode,
  getSelectionHtmlRanges: getSelectionHtmlRanges,
  extractTextDomMapping: extractTextDomMapping,
  adapter: {
    AbstractRichtextEditorAdapter: AbstractRichtextEditorAdapter,
    AutoBindAdapter: AutoBindAdapter,
    AsyncAutoBindAdapter: AsyncAutoBindAdapter,
    CKEditor5Adapter: CKEditor5Adapter,
    CKEditorAdapter: CKEditor4Adapter,
    CodeMirror6Adapter: CodeMirror6Adapter,
    CodeMirrorAdapter: CodeMirror5Adapter,
    ContentEditableAdapter: ContentEditableAdapter,
    HerettoContentEditableAdapter: HerettoContentEditableAdapter,
    AsyncContentEditableAdapter: AsyncContentEditableAdapter,
    InputAdapter: InputAdapter,
    MultiEditorAdapter: MultiEditorAdapter,
    AsyncMultiEditorAdapter: AsyncMultiEditorAdapter,
    TinyMCEAdapter: TinyMCEAdapter,
    XeditorAdapter: XeditorAdapter,
    QuipAdapter: QuipAdapter,
    SynchronizeAsyncAdapter: SynchronizeAsyncAdapter,
  },
  lookup: {
    lookupMatches: lookupMatches,
  },
};

augmentedWindow.acrolinx.plugins = exported;
