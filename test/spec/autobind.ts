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

import _ from 'lodash';
import {hasError} from '../../src/adapters/AdapterInterface';
import {AutoBindAdapter} from '../../src/adapters/AutoBindAdapter';
import {bindAdaptersForCurrentPage, EDITABLE_ELEMENTS_SELECTOR, getEditableElements} from '../../src/autobind/autobind';
import {benchmark} from '../utils/test-utils';

const assert = chai.assert;

describe('autobind', function() {
  const containerDivId = 'autoBindTest';

  function setPageContent(html: string) {
    $('#' + containerDivId).html(html);
  }

  beforeEach(() => {
    $('body').append(`<div id="${containerDivId}"></div>`);
  });

  afterEach(() => {
    $('#' + containerDivId).remove();
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

    $('#autoBindTestIFrame').contents().find('html')
      .html(`<input id="inputInIFrame" type="text" value="input in iframe content" />`);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 6);

    const adaptersContent = adapters.map(a => a.getContent!({}));
    assert.equal(adaptersContent[0], 'input 1 content');
    assert.equal(adaptersContent[1], 'contentEditable content');
    assert.equal(adaptersContent[2], 'textarea content');
    assert.equal(adaptersContent[3], 'input 2 content');
    assert.equal(adaptersContent[4], 'input 3 content');
    assert.equal(adaptersContent[5], 'input in iframe content');
  });

  // This test depends on an available internet.
  it('ignore iframes from other domains ', function(this: any, done: any) {
    this.timeout(5000);

    setPageContent(`
          <input id="input 1" type="" value="input 1 content" />
          <!-- Just an example for a page from a different domain. -->
          <iframe id="iframeFromOtherDomain" src="http://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/master/samples/autobind/iframe-different-domain.html"></iframe>
          <input id="input 2" type="" value="input 2 content" />
      `);

    const onLoadedOnce = _.once(() => {
      const adapters = bindAdaptersForCurrentPage();
      assert.equal(adapters.length, 2);

      const adaptersContent = adapters.map(a => a.getContent!({}));
      assert.equal(adaptersContent[0], 'input 1 content');
      assert.equal(adaptersContent[1], 'input 2 content');
      done();
    });

    $('#iframeFromOtherDomain').on('load', onLoadedOnce);
    setTimeout(onLoadedOnce, 3000);

  });

  it('dont bind readonly fields', () => {
    setPageContent(`
          <input readonly/>
          <textarea readonly></textarea>
      `);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 0);
  });

  it('bind shadow root fields', () => {
    setPageContent(`
          <div id="container"></div>
          <script>
            (() => {
              const root = container.attachShadow({ mode: "open" });
              const element = document.createElement("input")
              element.setAttribute("type", "text");
              root.appendChild(element);
            })();
          </script>
      `);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 1);
  });

  it('bind nested shadow root fields', () => {
    setPageContent(`
          <div id="container"></div>
          <input type="text"></input>
          <script>
            (() => {
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
            })();
          </script>
      `);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 3);
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
    assert.equal(adapters.length, 0);
  });

  it('dont bind fields that are probably comboboxes', () => {
    setPageContent(`
          <input role="combobox" autocomplete="off"/>
          <input role="combobox" autocomplete="false"/>
          <textarea role="combobox" autocomplete="off"/></textarea>
      `);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 0);
  });

  it('bind input field that looks a bit like a combobox but is not really', () => {
    // Such pseudo-comboboxes can be found on https://web.skype.com
    setPageContent(`
          <input role="combobox" />
      `);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 1);
  });

  it('dont bind probable search fields', () => {
    setPageContent(`
          <input role="search"/>
          <input name="q" autocomplete="off"/>
          <input name="search_query" autocomplete="off"/>
      `);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 0);
  });

  it('dont bind probable username fields', () => {
    setPageContent(`
          <input name="username" />
          <input name="login" />
          <input name="user[login]" />
          <input name="authenticity_token" />
      `);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 0);
  });


  describe('AutoBindAdapter', () => {
    it('uses wrapper attributes from adapters', (done) => {
      setPageContent(`
          <input id="inputId" class="inputClass" name="inputName" value="text"/>
          <div id="divId" class="divClass" contenteditable="true">html</div>
      `);

      const autobindAdapter = new AutoBindAdapter({});
      const extractedContent = autobindAdapter.extractContentForCheck({});
      extractedContent.then(result => {
        if (hasError(result)) {
          done(result.error);
          return;
        }
        assert.equal(result.content,
          '<div original-id="inputId" original-class="inputClass" original-name="inputName" original-source="input" id="acrolinx_integration0">text</div>' +
          '<div original-id="divId" original-class="divClass" original-source="div" id="acrolinx_integration1">html</div>'
        );
        done();
      }).catch(done);
    });

    it('returns format of inner MultiEditor ', () => {
      const autobindAdapterAuto = new AutoBindAdapter({aggregateFormat: 'AUTO'});
      assert.equal(autobindAdapterAuto.getFormat(), 'AUTO');

      const autobindAdapterHtml = new AutoBindAdapter({aggregateFormat: 'HTML'});
      assert.equal(autobindAdapterHtml.getFormat(), 'HTML');
    });
  });
});

describe('getEditableElements performance with no shadow dom', () => {
  let bigTree: HTMLElement;

  const containerDivId = 'getEditableElementsTest';

  before(() => {
    bigTree = createDivTree(20, 4);
  });

  beforeEach(() => {
    $('body').append(`<div id="${containerDivId}"></div>`);
    $('#' + containerDivId).remove().append(bigTree);
  });

  afterEach(() => {
    $('#' + containerDivId).remove();
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
    return _.flatMap(doc.querySelectorAll('*'),
      el => el.shadowRoot ? getEditableElementsSlow(el.shadowRoot) : []
    );
  }

  function getEditableElementsSlow(doc: Document | ShadowRoot | HTMLElement = document): Element[] {
    return _(doc.querySelectorAll(EDITABLE_ELEMENTS_SELECTOR))
      .union(traverseShadowRootSlow(doc))
      .value();
  }

  it('test-test: big tree is big', () => {
    const numberOfNodes = bigTree.querySelectorAll('*').length;
    assert.equal(numberOfNodes, 168420);
  });

  it('getEditableElements is faster than slow on a big tree', function() {
    this.timeout(10000);

    const benchmarkResultSlow = benchmark(10, () => {
      const nodes = getEditableElementsSlow(bigTree);
      assert.equal(nodes.length, 0);
    });

    const benchmarkResult = benchmark(10, () => {
      const nodes = getEditableElements(bigTree);
      assert.equal(nodes.length, 0);
    });

    const speedUp = benchmarkResultSlow.timeMsPerRun / benchmarkResult.timeMsPerRun;

    // console.log('getEditableElements speedup', benchmarkResultSlow.timeMsPerRun, benchmarkResult.timeMsPerRun, speedUp);

    // In practise the speedup is often larger, but we use a low value here to reduce the risk of fail tests.
    // In Safari and Firefox the speedup can be up to 5.
    // (However on our Mac Jenkins build slaves on Chrome it's a different story.)
    const isMac = navigator.appVersion.indexOf('Mac') >= 0;
    assert.isAbove(speedUp, isMac ? 1.0 : 1.2);
  });
});

describe('getEditableElements performance for a big shadow dom', () => {
  let container: HTMLElement;
  let bigTree: HTMLElement;

  const containerDivId = 'getEditableElementsShadowTest';

  before(() => {
    bigTree = createShadowTree(10, 4);
  });

  beforeEach(() => {
    $('body').append(`<div id="${containerDivId}"></div>`);
    container = document.querySelector<HTMLElement>('#' + containerDivId)!;
    $('#' + containerDivId).remove().append(bigTree);
  });

  afterEach(() => {
    $('#' + containerDivId).remove();
  });

  function createShadowTree(breadth: number, deep: number): HTMLElement {
    const element = document.createElement('div');
    const shadowRoot = element.attachShadow({mode: 'open'});
    if (deep > 0) {
      for (let i = 0; i < breadth; i++) {
        shadowRoot.appendChild(createShadowTree(breadth, deep - 1));
      }
    }
    return element;
  }

  it('getEditableElements is fast enough on big nested shadow dom trees', function() {
    this.timeout(1000);
    const benchmarkResult = benchmark(2, () => {
      const nodes = getEditableElements(container);
      assert.equal(nodes.length, 0);
    });
    assert.isTrue(benchmarkResult.timeMsPerRun < 500);
    // console.log(benchmarkResult.timeMsPerRun);
  });
});


