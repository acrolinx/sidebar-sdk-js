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

import { SidebarConfiguration, Message } from '@acrolinx/sidebar-interface';
import { AcrolinxPluginConfig } from './acrolinx-plugin-config';
import { AdapterInterface, AsyncAdapterInterface, isAsyncAdapterInterface } from './adapters/adapter-interface';
import { InternalAcrolinxSidebarPlugin, initInternalAcrolinxSidebarPlugin } from './internal-acrolinx-plugin';
import { SynchronizeAsyncAdapter } from './adapters/synchronize-async-adapter';

export class AcrolinxPlugin {
  private readonly initConfig: AcrolinxPluginConfig;
  private adapter?: AdapterInterface | AsyncAdapterInterface;
  private config: SidebarConfiguration;
  private internalPlugin?: InternalAcrolinxSidebarPlugin;

  constructor(conf: AcrolinxPluginConfig) {
    this.initConfig = conf;
    this.config = {};
  }

  registerAdapter(adapter: AdapterInterface) {
    if (isAsyncAdapterInterface(adapter) && adapter.requiresSynchronization) {
      this.adapter = new SynchronizeAsyncAdapter(adapter);
    } else {
      this.adapter = adapter;
    }
  }

  configure(conf: SidebarConfiguration) {
    this.config = { ...this.config, ...conf };
    // TODO: Move the this whole method into the internal plugin?
    if (this.internalPlugin && this.internalPlugin.acrolinxSidebar) {
      this.internalPlugin.configureSidebar(this.config);
    }
  }

  check() {
    if (this.internalPlugin) {
      this.internalPlugin.requestGlobalCheck();
    }
  }

  /**
   * Show a message in the Sidebar.
   * Supported since Acrolinx Platform 2021.2 (Sidebar version 14.28).
   * @param message The message to show.
   */
  showMessage(message: Message) {
    try {
      this.internalPlugin!.acrolinxSidebar.showMessage(message);
      console.log('acrolinxSidebar.showMessage', message);
    } catch (error) {
      console.warn('Error while trying to call acrolinxSidebar.showMessage', error, message);
    }
  }

  async init() {
    if (!this.adapter) {
      throw new Error('Missing registered adapter. Please use registerAdapter before init.');
    }
    this.internalPlugin = await initInternalAcrolinxSidebarPlugin(this.initConfig, this.adapter, () => {
      this.internalPlugin!.configureSidebar(this.config);
    });
  }

  dispose(callback: () => void) {
    const sidebarContainer = document.getElementById(this.initConfig.sidebarContainerId);
    if (sidebarContainer) {
      const iFrame: HTMLIFrameElement | null = sidebarContainer.querySelector('iframe');
      if (iFrame) {
        // Changing the src before cleaning the whole container is needed at least in IE 11
        // to avoid exceptions inside the iFrame caused by disappearing javascript objects.
        // The try/catch is just added to be on the safe side.
        try {
          iFrame.src = 'about:blank';
          setTimeout(() => {
            sidebarContainer.innerHTML = '';
            callback();
          }, 0);
        } catch (error) {
          console.error(error);
          callback();
        }
      } else {
        callback();
      }
    }
  }
}
