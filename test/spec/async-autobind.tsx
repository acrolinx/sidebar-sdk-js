/*
 * Copyright 2020-present Acrolinx GmbH
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
import { act } from 'react-dom/test-utils';
import ReactDOM from "react-dom";
import React from 'react';
import App from './adapter-test-setups/draftjs-editor/draftApp';
import { bindAdaptersForCurrentPage } from '../../src/autobind/autobind';

describe('asyncAutobind DraftJS', function () {

  let rootContainer: Element
  beforeEach(() => {
    rootContainer = document.createElement("div");
    document.body.appendChild(rootContainer);
  });

  afterEach(() => {
    document.body.removeChild(rootContainer);
  });

  it('binds async adapter', () => {
    act(() => {
      ReactDOM.render(<App />, rootContainer);
    });

    const adapters = bindAdaptersForCurrentPage();
    chai.assert.equal(adapters.length, 1);

    const adaptersContent = adapters.map(a => a.getContent!({}));
    // TODO: A way to change state of editor for tests.
    chai.assert.isTrue(adaptersContent[0].includes('This is test conteent.'));
  });

});


