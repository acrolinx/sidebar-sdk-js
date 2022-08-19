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

export {AcrolinxPlugin, autoBindFloatingSidebar} from "./acrolinx-plugin";
export {AdapterInterface, AsyncAdapterInterface, CommonAdapterInterface} from "./adapters/AdapterInterface";
export {InputAdapter} from "./adapters/InputAdapter";
export {ContentEditableAdapter} from "./adapters/ContentEditableAdapter";
export {AsyncContentEditableAdapter as StateBasedContentEditableAdapter} from "./adapters/AsyncContentEditableAdapter";
export {AbstractRichtextEditorAdapter} from "./adapters/AbstractRichtextEditorAdapter";
export {CKEditorAdapter} from "./adapters/CKEditorAdapter";
export {CKEditor5Adapter} from "./adapters/CKEditor5Adapter";
export {TinyMCEAdapter} from "./adapters/TinyMCEAdapter";
export {TinyMCEWordpressAdapter} from "./adapters/TinyMCEWordpressAdapter";
export {AutoBindAdapter} from "./adapters/AutoBindAdapter";
export {AsyncAutoBindAdapter} from "./adapters/AsyncAutoBindAdapter";
export {MultiEditorAdapter} from "./adapters/MultiEditorAdapter";
export {AsyncMultiEditorAdapter} from "./adapters/AsyncMultiEditorAdapter";
export {createPluginMessageAdapter} from "./message-adapter/message-adapter";
export {loadSidebarCode} from "./utils/sidebar-loader";
export {getSelectionHtmlRanges} from "./utils/check-selection";
export {lookupMatches} from "./lookup/diff-based";
export {extractTextDomMapping} from "./utils/text-dom-mapping";
export {CodeMirrorAdapter} from "./adapters/CodeMirrorAdapter";
export {initFloatingSidebar} from "./floating-sidebar/floating-sidebar";
export {AsyncLocalStorage} from "./floating-sidebar/async-storage";
