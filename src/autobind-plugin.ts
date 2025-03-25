/*
 * Copyright 2015-present Acrolinx GmbH
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

import { AcrolinxPlugin } from './acrolinx-plugin';
import { AcrolinxPluginConfig } from './acrolinx-plugin-config';
import { AsyncAutoBindAdapter } from './adapters/async-autobind-adapter';
import { AutoBindAdapter } from './adapters/autobind-adapter';
import { MultiEditorAdapterConfig } from './adapters/multi-editor-adapter';
import { AutobindConfig } from './autobind/autobind';
import { AsyncLocalStorage, AsyncStorage } from './floating-sidebar/async-storage';
import { FloatingSidebar, initFloatingSidebar, SIDEBAR_CONTAINER_ID } from './floating-sidebar/floating-sidebar';
import { assign } from './utils/utils';

export interface AutoBindFloatingSidebarConfig extends AcrolinxPluginConfig, MultiEditorAdapterConfig, AutobindConfig {
  asyncStorage?: AsyncStorage;
}

// Synchronous - Remember to make changes to asynchronous version if necessary.
export async function autoBindFloatingSidebar(basicConf: AutoBindFloatingSidebarConfig): Promise<FloatingSidebar> {
  const conf = assign(basicConf, {
    sidebarContainerId: SIDEBAR_CONTAINER_ID,
    asyncStorage: basicConf.asyncStorage || new AsyncLocalStorage(),
  });

  const floatingSidebar = initFloatingSidebar(conf);

  const acrolinxPlugin = new AcrolinxPlugin(conf);
  acrolinxPlugin.registerAdapter(new AutoBindAdapter(conf));
  await acrolinxPlugin.init();

  return floatingSidebar;
}

export async function autoBindFloatingSidebarAsync(basicConf: AutoBindFloatingSidebarConfig): Promise<FloatingSidebar> {
  const conf = assign(basicConf, {
    sidebarContainerId: SIDEBAR_CONTAINER_ID,
    asyncStorage: basicConf.asyncStorage || new AsyncLocalStorage(),
  });

  const floatingSidebar = initFloatingSidebar(conf);

  const acrolinxPlugin = new AcrolinxPlugin(conf);
  acrolinxPlugin.registerAdapter(new AsyncAutoBindAdapter(conf));
  await acrolinxPlugin.init();

  return floatingSidebar;
}
