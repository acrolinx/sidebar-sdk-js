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

export { AcrolinxPlugin } from './acrolinx-plugin';
export type { AcrolinxPluginConfig } from './acrolinx-plugin-config';
export { autoBindFloatingSidebar, autoBindFloatingSidebarAsync } from './autobind-plugin';
export type { AdapterInterface, AsyncAdapterInterface, CommonAdapterInterface } from './adapters/AdapterInterface';
export { InputAdapter } from './adapters/InputAdapter';
export { ContentEditableAdapter } from './adapters/ContentEditableAdapter';
export { AsyncContentEditableAdapter as StateBasedContentEditableAdapter } from './adapters/AsyncContentEditableAdapter';
export { AbstractRichtextEditorAdapter } from './adapters/AbstractRichtextEditorAdapter';
export { CKEditor5Adapter } from './adapters/CKEditor5Adapter';
export { CKEditor4Adapter as CKEditorAdapter } from './adapters/CKEditor4Adapter';
export { TinyMCEAdapter } from './adapters/TinyMCEAdapter';
export { AutoBindAdapter } from './adapters/AutoBindAdapter';
export { AsyncAutoBindAdapter } from './adapters/AsyncAutoBindAdapter';
export { MultiEditorAdapter } from './adapters/MultiEditorAdapter';
export { AsyncMultiEditorAdapter } from './adapters/AsyncMultiEditorAdapter';
export { createPluginMessageAdapter } from './message-adapter/message-adapter';
export { loadSidebarCode } from './utils/sidebar-loader';
export { getSelectionHtmlRanges } from './utils/check-selection';
export { lookupMatches } from './lookup/diff-based';
export { extractTextDomMapping } from './utils/text-dom-mapping';
export { CodeMirror6Adapter } from './adapters/CodeMirror6Adapter';
export { CodeMirror5Adapter as CodeMirrorAdapter } from './adapters/CodeMirror5Adapter';
export { initFloatingSidebar } from './floating-sidebar/floating-sidebar';
export { AsyncLocalStorage } from './floating-sidebar/async-storage';
export { XeditorAdapter } from './adapters/XeditorAdapter';

import { AcrolinxPlugin } from './acrolinx-plugin';
import { autoBindFloatingSidebar, autoBindFloatingSidebarAsync } from './autobind-plugin';
import { InputAdapter } from './adapters/InputAdapter';
import { ContentEditableAdapter } from './adapters/ContentEditableAdapter';
import { AsyncContentEditableAdapter } from './adapters/AsyncContentEditableAdapter';
import { AbstractRichtextEditorAdapter } from './adapters/AbstractRichtextEditorAdapter';
import { CKEditor5Adapter } from './adapters/CKEditor5Adapter';
import { CKEditor4Adapter } from './adapters/CKEditor4Adapter';
import { TinyMCEAdapter } from './adapters/TinyMCEAdapter';
import { AutoBindAdapter } from './adapters/AutoBindAdapter';
import { AsyncAutoBindAdapter } from './adapters/AsyncAutoBindAdapter';
import { MultiEditorAdapter } from './adapters/MultiEditorAdapter';
import { AsyncMultiEditorAdapter } from './adapters/AsyncMultiEditorAdapter';
import { createPluginMessageAdapter } from './message-adapter/message-adapter';
import { loadSidebarCode } from './utils/sidebar-loader';
import { getSelectionHtmlRanges } from './utils/check-selection';
import { lookupMatches } from './lookup/diff-based';
import { extractTextDomMapping } from './utils/text-dom-mapping';
import { CodeMirror6Adapter } from './adapters/CodeMirror6Adapter';
import { CodeMirror5Adapter } from './adapters/CodeMirror5Adapter';
import { initFloatingSidebar } from './floating-sidebar/floating-sidebar';
import { AsyncLocalStorage } from './floating-sidebar/async-storage';
import { XeditorAdapter } from './adapters/XeditorAdapter';

export interface AcrolinxSidebarIntegration {
  AcrolinxPlugin: typeof AcrolinxPlugin;
  autoBindFloatingSidebar: typeof autoBindFloatingSidebar;
  autoBindFloatingSidebarAsync: typeof autoBindFloatingSidebarAsync;
  initFloatingSidebar: typeof initFloatingSidebar;
  AsyncLocalStorage: typeof AsyncLocalStorage;
  createPluginMessageAdapter: typeof createPluginMessageAdapter;
  loadSidebarCode: typeof loadSidebarCode;
  getSelectionHtmlRanges: typeof getSelectionHtmlRanges;
  adapter: {
    AbstractRichtextEditorAdapter: typeof AbstractRichtextEditorAdapter;
    AutoBindAdapter: typeof AutoBindAdapter;
    AsyncAutoBindAdapter: typeof AsyncAutoBindAdapter;
    CKEditor5Adapter: typeof CKEditor5Adapter;
    CKEditorAdapter: typeof CKEditor4Adapter;
    CodeMirror6Adapter: typeof CodeMirror6Adapter;
    CodeMirrorAdapter: typeof CodeMirror5Adapter;
    ContentEditableAdapter: typeof ContentEditableAdapter;
    AsyncContentEditableAdapter: typeof AsyncContentEditableAdapter;
    InputAdapter: typeof InputAdapter;
    MultiEditorAdapter: typeof MultiEditorAdapter;
    AsyncMultiEditorAdapter: typeof AsyncMultiEditorAdapter;
    TinyMCEAdapter: typeof TinyMCEAdapter;
    XeditorAdapter: typeof XeditorAdapter;
  };
  lookup: {
    lookupMatches: typeof lookupMatches;
  };
  extractTextDomMapping: typeof extractTextDomMapping;
}

declare global {
  const acrolinx: {
    plugins: AcrolinxSidebarIntegration;
  };
}

const augmentedWindow = window as any;

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
  adapter: {
    AbstractRichtextEditorAdapter: AbstractRichtextEditorAdapter,
    AutoBindAdapter: AutoBindAdapter,
    AsyncAutoBindAdapter: AsyncAutoBindAdapter,
    CKEditor5Adapter: CKEditor5Adapter,
    CKEditorAdapter: CKEditor4Adapter,
    CodeMirror6Adapter: CodeMirror6Adapter,
    CodeMirrorAdapter: CodeMirror5Adapter,
    ContentEditableAdapter: ContentEditableAdapter,
    AsyncContentEditableAdapter: AsyncContentEditableAdapter,
    InputAdapter: InputAdapter,
    MultiEditorAdapter: MultiEditorAdapter,
    AsyncMultiEditorAdapter: AsyncMultiEditorAdapter,
    TinyMCEAdapter: TinyMCEAdapter,
    XeditorAdapter: XeditorAdapter,
  },
  lookup: {
    lookupMatches: lookupMatches,
  },
  extractTextDomMapping: extractTextDomMapping,
};

augmentedWindow.acrolinx.plugins = exported;
