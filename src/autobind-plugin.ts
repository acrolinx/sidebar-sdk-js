import { AcrolinxPlugin } from './acrolinx-plugin';
import { AcrolinxPluginConfig } from './acrolinx-plugin-config';
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
