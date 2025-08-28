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

import { describe, beforeEach, afterEach, it, expect, beforeAll } from 'vitest';
import { hasError, SuccessfulContentExtractionResult } from '../../src/adapters/AdapterInterface';
import { AutoBindAdapter } from '../../src/adapters/AutoBindAdapter';
import {
  bindAdaptersForCurrentPage,
  EDITABLE_ELEMENTS_SELECTOR,
  getEditableElements,
} from '../../src/autobind/autobind';
import { benchmark } from './utils/test-utils';
import { AsyncAutoBindAdapter } from '../../src/adapters/AsyncAutoBindAdapter';

describe('autobind', () => {
  const containerDivId = 'autoBindTest';

  const setPageContent = (html: string, scriptString?: string) => {
    const container = document.getElementById(containerDivId);
    if (container) {
      container.innerHTML = html;

      if (scriptString) {
        // Find the newly created container (assuming you have a #container within the html)
        const newContainer = container.querySelector('#container');

        if (newContainer) {
          const script = document.createElement('script');
          script.textContent = scriptString;
          newContainer.appendChild(script);
        }
      }
    }
  };

  beforeEach(() => {
    const container = document.createElement('div');
    container.id = containerDivId;
    document.body.appendChild(container);
  });

  afterEach(() => {
    const container = document.getElementById(containerDivId);
    if (container) {
      container.remove();
    }
  });

  it('binds all adapters', () => {
    setPageContent(`
          <input id="input1" value="input 1 content" />
          <div id="ContentEditableAdapter" contenteditable="true">contentEditable content</div>
          <textarea id="InputAdapter">textarea content</textarea>
          <input id="input2" type="" value="input 2 content" />
          <input id="input3" type="text" value="input 3 content" />
          <input type="checkbox" value="We must ignore a checkbox." />
          <iframe id="autoBindTestIFrame" src=""></iframe>
      `);

    const iframe = document.getElementById('autoBindTestIFrame') as HTMLIFrameElement;
    if (iframe) {
      const iframeDocument = iframe.contentDocument || iframe.contentWindow!.document;
      if (iframeDocument) {
        iframeDocument.querySelector('html')!.innerHTML =
          '<input id="inputInIFrame" type="text" value="input in iframe content" />';
      }
    }

    const adapters = bindAdaptersForCurrentPage();
    expect(adapters.length).toBe(6);

    const adaptersContent = adapters.map((a) => a.getContent!({}));
    expect(adaptersContent[0]).toBe('input 1 content');
    expect(adaptersContent[1]).toBe('contentEditable content');
    expect(adaptersContent[2]).toBe('textarea content');
    expect(adaptersContent[3]).toBe('input 2 content');
    expect(adaptersContent[4]).toBe('input 3 content');
    expect(adaptersContent[5]).toBe('input in iframe content');
  });

  // This test depends on an available internet.
  it('ignore iframes from other domains', async () => {
    setPageContent(`
      <input id="input 1" type="" value="input 1 content" />
      <iframe id="iframeFromOtherDomain" src="http://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/master/samples/autobind/iframe-different-domain.html"></iframe>
      <input id="input 2" type="" value="input 2 content" />
    `);

    const iframe = document.getElementById('iframeFromOtherDomain') as HTMLIFrameElement;

    const loadEvent = new Event('load');

    await new Promise<void>((resolve) => {
      let executed = false;
      const onLoadedOnce = () => {
        if (!executed) {
          executed = true;
          const adapters = bindAdaptersForCurrentPage();
          expect(adapters.length).toBe(2);

          const adaptersContent = adapters.map((a) => a.getContent!({}));
          expect(adaptersContent[0]).toEqual('input 1 content');
          expect(adaptersContent[1]).toEqual('input 2 content');
          resolve();
        }
      };

      if (iframe) {
        iframe.dispatchEvent(loadEvent);
        onLoadedOnce();
      } else {
        setTimeout(onLoadedOnce, 0);
      }
    });
  });

  it('dont bind readonly fields', () => {
    setPageContent(`
          <input readonly/>
          <textarea readonly></textarea>
      `);

    const adapters = bindAdaptersForCurrentPage();
    expect(adapters.length).toEqual(0);
  });

  it('bind shadow root fields', () => {
    setPageContent(
      `<div id="container"></div>`,
      `(() => {
              const root = container.attachShadow({ mode: "open" });
              const element = document.createElement("input")
              element.setAttribute("type", "text");
              root.appendChild(element);
            })()`,
    );

    const adapters = bindAdaptersForCurrentPage();
    expect(adapters.length).toEqual(1);
  });

  it('bind nested shadow root fields', () => {
    setPageContent(
      `
          <div id="container"></div>
          <input type="text"></input>`,
      `(() => {
              const root = container.attachShadow({ mode: "open" });
              const inputElement = document.createElement("input");
              inputElement.setAttribute("type", "text");

              // Add a nested shadow
              const innerContainer = document.createElement("div");
              innerContainer.setAttribute("id", "innerContainer");
              const nestedRoot = innerContainer.attachShadow({ mode: "open" });
              const inputElementNested = document.createElement("input");
              inputElementNested.setAttribute("type", "text");
              nestedRoot.appendChild(inputElementNested);

              root.appendChild(inputElement);
              root.appendChild(innerContainer);
            })();`,
    );

    const adapters = bindAdaptersForCurrentPage();
    expect(adapters.length).toEqual(3);
  });

  it('dont bind closed shadow root fields', () => {
    setPageContent(`
          <div id="container"></div>
          <script>
            (() => {
              const root = container.attachShadow({ mode: "closed" });
              const element = document.createElement("input")
              element.setAttribute("type", "text");
              root.appendChild(element);
            })();
          </script>
      `);

    const adapters = bindAdaptersForCurrentPage();
    expect(adapters.length).toEqual(0);
  });

  it('dont bind fields that are probably comboboxes', () => {
    setPageContent(`
          <input role="combobox" autocomplete="off"/>
          <input role="combobox" autocomplete="false"/>
          <textarea role="combobox" autocomplete="off"/></textarea>
      `);

    const adapters = bindAdaptersForCurrentPage();
    expect(adapters.length).toEqual(0);
  });

  it('bind input field that looks a bit like a combobox but is not really', () => {
    // Such pseudo-comboboxes can be found on https://web.skype.com
    setPageContent(`
          <input role="combobox" />
      `);

    const adapters = bindAdaptersForCurrentPage();
    expect(adapters.length).toEqual(1);
  });

  it('dont bind probable search fields', () => {
    setPageContent(`
          <input role="search"/>
          <input name="q" autocomplete="off"/>
          <input name="search_query" autocomplete="off"/>
      `);

    const adapters = bindAdaptersForCurrentPage();
    expect(adapters.length).toEqual(0);
  });

  it('dont bind probable username fields', () => {
    setPageContent(`
          <input name="username" />
          <input name="login" />
          <input name="user[login]" />
          <input name="authenticity_token" />
      `);

    const adapters = bindAdaptersForCurrentPage();
    expect(adapters.length).toEqual(0);
  });

  describe('AutoBindAdapter', () => {
    it('uses wrapper attributes from adapters', async () => {
      setPageContent(`
          <input id="inputId" class="inputClass" name="inputName" value="text"/>
          <div id="divId" class="divClass" contenteditable="true">html</div>
      `);

      const autobindAdapter = new AutoBindAdapter({});
      const result = await autobindAdapter.extractContentForCheck({});
      expect(hasError(result)).toBeFalsy();
      expect((result as SuccessfulContentExtractionResult).content).toEqual(
        '<div original-id="inputId" original-class="inputClass" original-name="inputName" original-source="input" id="acrolinx_integration0">text</div>' +
          '<div original-id="divId" original-class="divClass" original-source="div" id="acrolinx_integration1">html</div>',
      );
    });

    it('returns format of inner MultiEditor ', () => {
      const autobindAdapterAuto = new AutoBindAdapter({ aggregateFormat: 'AUTO' });
      expect(autobindAdapterAuto.getFormat()).toEqual('AUTO');

      const autobindAdapterHtml = new AutoBindAdapter({ aggregateFormat: 'HTML' });
      expect(autobindAdapterHtml.getFormat()).toEqual('HTML');
    });
  });

  describe('AsyncAutoBindAdapter', () => {
    it('uses wrapper attributes from adapters', async () => {
      setPageContent(`
            <input id="inputId" class="inputClass" name="inputName" value="text"/>
            <div id="divId" class="divClass" contenteditable="true">html</div>
        `);

      const autobindAdapter = new AsyncAutoBindAdapter({});
      const result = await autobindAdapter.extractContentForCheck({});
      expect(hasError(result)).toBeFalsy();
      expect((result as SuccessfulContentExtractionResult).content).toEqual(
        '<div original-id="inputId" original-class="inputClass" original-name="inputName" original-source="input" id="acrolinx_integration0">text</div>' +
          '<div original-id="divId" original-class="divClass" original-source="div" id="acrolinx_integration1">html</div>',
      );
    });

    it('returns format of inner MultiEditor ', () => {
      const autobindAdapterAuto = new AsyncAutoBindAdapter({ aggregateFormat: 'AUTO' });
      expect(autobindAdapterAuto.getFormat()).toEqual('AUTO');
      const autobindAdapterHtml = new AsyncAutoBindAdapter({ aggregateFormat: 'HTML' });
      expect(autobindAdapterHtml.getFormat()).toEqual('HTML');
    });
  });
});

describe('getEditableElements performance with no shadow dom', () => {
  let bigTree: HTMLElement;

  const containerDivId = 'getEditableElementsTest';

  beforeAll(() => {
    bigTree = createDivTree(20, 4);
  });

  beforeEach(() => {
    const existingContainer = document.getElementById(containerDivId);
    if (existingContainer) {
      existingContainer.innerHTML = '';
      existingContainer.appendChild(bigTree);
    } else {
      const newContainer = document.createElement('div');
      newContainer.id = containerDivId;
      newContainer.appendChild(bigTree);
      document.body.appendChild(newContainer);
    }
  });

  afterEach(() => {
    const container = document.getElementById(containerDivId);
    if (container) {
      container.remove();
    }
  });

  function createDivTree(breadth: number, deep: number): HTMLElement {
    const element = document.createElement('div');
    if (deep > 0) {
      for (let i = 0; i < breadth; i++) {
        element.appendChild(createDivTree(breadth, deep - 1));
      }
    }
    return element;
  }

  function traverseShadowRootSlow(doc: Document | ShadowRoot | HTMLElement): Element[] {
    return Array.from(doc.querySelectorAll('*')).flatMap((el) =>
      el.shadowRoot ? getEditableElementsSlow(el.shadowRoot) : [],
    );
  }

  function getEditableElementsSlow(doc: Document | ShadowRoot | HTMLElement = document): Element[] {
    const elements = Array.from(doc.querySelectorAll(EDITABLE_ELEMENTS_SELECTOR));
    const shadowRootElements = traverseShadowRootSlow(doc);
    return [...new Set([...elements, ...shadowRootElements])];
  }

  it('test-test: big tree is big', () => {
    const numberOfNodes = bigTree.querySelectorAll('*').length;
    expect(numberOfNodes).toBe(168420);
  });

  it('getEditableElements is faster than slow on a big tree', () => {
    const benchmarkResultSlow = benchmark(10, () => {
      const nodes = getEditableElementsSlow(bigTree);
      expect(nodes.length).toBe(0);
    });

    const benchmarkResult = benchmark(10, () => {
      const nodes = getEditableElements(bigTree);
      expect(nodes.length).toBe(0);
    });

    const speedUp = benchmarkResultSlow.timeMsPerRun / benchmarkResult.timeMsPerRun;

    // console.log('getEditableElements speedup', benchmarkResultSlow.timeMsPerRun, benchmarkResult.timeMsPerRun, speedUp);

    // In practise the speedup is often larger, but we use a low value here to reduce the risk of fail tests.
    // In Safari and Firefox the speedup can be up to 5.
    // (However on our Mac Jenkins build slaves on Chrome it's a different story.)
    // And on github actions the speedup is about 1.1
    // const isMac = navigator.appVersion.indexOf('Mac') >= 0;
    // Speedup on GH Actions is always flaky, depends on VM
    expect(speedUp).toBeGreaterThan(1.0);
  });
});

describe('getEditableElements performance for a big shadow dom', () => {
  let container: HTMLElement;
  let bigTree: HTMLElement;

  const containerDivId = 'getEditableElementsShadowTest';

  beforeAll(() => {
    bigTree = createShadowTree(10, 4);
  });

  beforeEach(() => {
    const existingContainer = document.getElementById(containerDivId);

    if (existingContainer) {
      existingContainer.innerHTML = '';
      existingContainer.appendChild(bigTree);
      container = existingContainer;
    } else {
      const newContainer = document.createElement('div');
      newContainer.id = containerDivId;
      newContainer.appendChild(bigTree);
      document.body.appendChild(newContainer);
      container = newContainer;
    }
  });

  afterEach(() => {
    const container = document.getElementById(containerDivId);
    if (container) {
      container.remove();
    }
  });

  const createShadowTree = (breadth: number, deep: number): HTMLElement => {
    const element = document.createElement('div');
    const shadowRoot = element.attachShadow({ mode: 'open' });
    if (deep > 0) {
      for (let i = 0; i < breadth; i++) {
        shadowRoot.appendChild(createShadowTree(breadth, deep - 1));
      }
    }
    return element;
  };

  it('getEditableElements is fast enough on big nested shadow dom trees', () => {
    const benchmarkResult = benchmark(2, () => {
      const nodes = getEditableElements(container);
      expect(nodes.length).toBe(0);
    });
    expect(benchmarkResult.timeMsPerRun < 500).toBeTruthy();
    // console.log(benchmarkResult.timeMsPerRun);
  });
});
