/*
 * Copyright 2016-present Acrolinx GmbH
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

import { AcrolinxPlugin, autoBindFloatingSidebar, autoBindFloatingSidebarAsync } from './acrolinx-plugin';
import { InputAdapter } from './adapters/InputAdapter';
import { ContentEditableAdapter } from './adapters/ContentEditableAdapter';
import { AbstractRichtextEditorAdapter } from './adapters/AbstractRichtextEditorAdapter';
import { CKEditorAdapter } from './adapters/CKEditorAdapter';
import { CKEditor5Adapter } from './adapters/CKEditor5Adapter';
import { TinyMCEAdapter } from './adapters/TinyMCEAdapter';
import { TinyMCEWordpressAdapter } from './adapters/TinyMCEWordpressAdapter';
import { AutoBindAdapter } from './adapters/AutoBindAdapter';
import { AsyncAutoBindAdapter } from './adapters/AsyncAutoBindAdapter';
import { MultiEditorAdapter } from './adapters/MultiEditorAdapter';
import { AsyncMultiEditorAdapter } from './adapters/AsyncMultiEditorAdapter';
import { createPluginMessageAdapter } from './message-adapter/message-adapter';
import { loadSidebarCode } from './utils/sidebar-loader';
import { getSelectionHtmlRanges } from './utils/check-selection';
import { lookupMatches } from './lookup/diff-based';
import { extractTextDomMapping } from './utils/text-dom-mapping';
import { CodeMirrorAdapter } from './adapters/CodeMirrorAdapter';
import { CodeMirror6Adapter } from './adapters/CodeMirror6Adapter';
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
    CKEditorAdapter: typeof CKEditorAdapter;
    CKEditor5Adapter: typeof CKEditor5Adapter;
    CodeMirrorAdapter: typeof CodeMirrorAdapter;
    CodeMirror6Adapter: typeof CodeMirror6Adapter;
    ContentEditableAdapter: typeof ContentEditableAdapter;
    InputAdapter: typeof InputAdapter;
    MultiEditorAdapter: typeof MultiEditorAdapter;
    AsyncMultiEditorAdapter: typeof AsyncMultiEditorAdapter;
    TinyMCEAdapter: typeof TinyMCEAdapter;
    TinyMCEWordpressAdapter: typeof TinyMCEWordpressAdapter;
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
    CKEditorAdapter: CKEditorAdapter,
    CKEditor5Adapter: CKEditor5Adapter,
    CodeMirrorAdapter: CodeMirrorAdapter,
    CodeMirror6Adapter: CodeMirror6Adapter,
    ContentEditableAdapter: ContentEditableAdapter,
    InputAdapter: InputAdapter,
    MultiEditorAdapter: MultiEditorAdapter,
    AsyncMultiEditorAdapter: AsyncMultiEditorAdapter,
    TinyMCEAdapter: TinyMCEAdapter,
    TinyMCEWordpressAdapter: TinyMCEWordpressAdapter,
    XeditorAdapter: XeditorAdapter,
  },
  lookup: {
    lookupMatches: lookupMatches,
  },
  extractTextDomMapping: extractTextDomMapping,
};

augmentedWindow.acrolinx.plugins = exported;
