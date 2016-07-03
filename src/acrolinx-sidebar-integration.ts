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



window.acrolinx = window.acrolinx || ({} as any);
window.acrolinx.plugins = {
  AcrolinxPlugin: AcrolinxPlugin,
  autoBindFloatingSidebar: autoBindFloatingSidebar,
  adapter: {
    AbstractRichtextEditorAdapter: AbstractRichtextEditorAdapter,
    AutoBindAdapter: AutoBindAdapter,
    CKEditorAdapter: CKEditorAdapter,
    ContentEditableAdapter: ContentEditableAdapter,
    InputAdapter: InputAdapter,
    MultiEditorAdapter: MultiEditorAdapter,
    TinyMCEAdapter: TinyMCEAdapter,
    TinyMCEWordpressAdapter: TinyMCEWordpressAdapter,
  }
};
