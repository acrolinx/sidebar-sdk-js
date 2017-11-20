/*
 *
 * * Copyright 2016 Acrolinx GmbH
 * *
 * * Licensed under the Apache License, Version 2.0 (the "License");
 * * you may not use this file except in compliance with the License.
 * * You may obtain a copy of the License at
 * *
 * * http://www.apache.org/licenses/LICENSE-2.0
 * *
 * * Unless required by applicable law or agreed to in writing, software
 * * distributed under the License is distributed on an "AS IS" BASIS,
 * * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * * See the License for the specific language governing permissions and
 * * limitations under the License.
 * *
 * * For more information visit: http://www.acrolinx.com
 *
 */

import {AcrolinxPlugin, autoBindFloatingSidebar} from "./acrolinx-plugin";
import {InputAdapter} from "./adapters/InputAdapter";
import {ContentEditableAdapter} from "./adapters/ContentEditableAdapter";
import {AbstractRichtextEditorAdapter} from "./adapters/AbstractRichtextEditorAdapter";
import {CKEditorAdapter} from "./adapters/CKEditorAdapter";
import {TinyMCEAdapter} from "./adapters/TinyMCEAdapter";
import {TinyMCEWordpressAdapter} from "./adapters/TinyMCEWordpressAdapter";
import {AutoBindAdapter} from "./adapters/AutoBindAdapter";
import {MultiEditorAdapter} from "./adapters/MultiEditorAdapter";
import {createPluginMessageAdapter} from "./message-adapter/message-adapter";
import {loadSidebarCode} from "./utils/sidebar-loader";
import {getSelectionHtmlRanges} from "./utils/range";
import {lookupMatches} from "./lookup/diff-based";


export interface AcrolinxSidebarIntegration {
  AcrolinxPlugin: typeof AcrolinxPlugin;
  autoBindFloatingSidebar: typeof autoBindFloatingSidebar;
  createPluginMessageAdapter: typeof createPluginMessageAdapter;
  loadSidebarCode: typeof loadSidebarCode;
  getSelectionHtmlRanges: typeof getSelectionHtmlRanges,
  adapter: {
    AbstractRichtextEditorAdapter: typeof AbstractRichtextEditorAdapter;
    AutoBindAdapter: typeof AutoBindAdapter;
    CKEditorAdapter: typeof CKEditorAdapter;
    ContentEditableAdapter: typeof ContentEditableAdapter;
    InputAdapter: typeof InputAdapter;
    MultiEditorAdapter: typeof MultiEditorAdapter;
    TinyMCEAdapter: typeof TinyMCEAdapter;
    TinyMCEWordpressAdapter: typeof TinyMCEWordpressAdapter;
  };
  lookup: {
    lookupMatches: typeof lookupMatches;
  }
}

declare global {
  /* tslint:disable:no-unused-variable */
  const acrolinx: {
    plugins: AcrolinxSidebarIntegration
  };
  /* tslint:enable */
}

const augmentedWindow = window as any;

augmentedWindow.acrolinx = augmentedWindow.acrolinx || ({} as any);

const exported: AcrolinxSidebarIntegration = {
  AcrolinxPlugin: AcrolinxPlugin,
  autoBindFloatingSidebar: autoBindFloatingSidebar,
  createPluginMessageAdapter: createPluginMessageAdapter,
  loadSidebarCode: loadSidebarCode,
  getSelectionHtmlRanges: getSelectionHtmlRanges,
  adapter: {
    AbstractRichtextEditorAdapter: AbstractRichtextEditorAdapter,
    AutoBindAdapter: AutoBindAdapter,
    CKEditorAdapter: CKEditorAdapter,
    ContentEditableAdapter: ContentEditableAdapter,
    InputAdapter: InputAdapter,
    MultiEditorAdapter: MultiEditorAdapter,
    TinyMCEAdapter: TinyMCEAdapter,
    TinyMCEWordpressAdapter: TinyMCEWordpressAdapter,
  },
  lookup: {
    lookupMatches: lookupMatches
  }
};

augmentedWindow.acrolinx.plugins = exported;
