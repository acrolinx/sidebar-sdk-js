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

const assert = chai.assert;

import {
  initFloatingSidebar,
  SIDEBAR_ID,
  FloatingSidebar,
  keepVisible,
  POSITION_KEY,
  DEFAULT_POS,
} from '../../src/floating-sidebar/floating-sidebar';
import { assertDeepEqual } from '../utils/test-utils';
import { AsyncLocalStorage } from '../../src/floating-sidebar/async-storage';

describe('async storage', () => {
  const storage = new AsyncLocalStorage();
  const testKey = 'testKey';

  beforeEach(() => {
    localStorage.removeItem(testKey);
  });

  it('set and get an object', (done) => {
    const testValue = { dummy: 'foo' };
    storage
      .set(testKey, testValue)
      .then(() => {
        storage
          .get(testKey)
          .then((restoredValue) => {
            assertDeepEqual(restoredValue, testValue);
            done();
          })
          .catch(done);
      })
      .catch(done);
  });

  it('set and get an string', (done) => {
    const testValue = 'foo';
    storage
      .set(testKey, testValue)
      .then(() => {
        storage
          .get(testKey)
          .then((restoredValue) => {
            assertDeepEqual(restoredValue, testValue);
            done();
          })
          .catch(done);
      })
      .catch(done);
  });

  it('return null for undefined keys', (done) => {
    storage
      .get(testKey)
      .then((restoredValue) => {
        chai.assert.isNull(restoredValue);
        done();
      })
      .catch(done);
  });

  it('reject promise if stored value is crap', (done) => {
    localStorage.setItem(testKey, '{');
    storage
      .get(testKey)
      .then((_restoredValue) => {
        done('Should be rejected');
      })
      .catch(() => {
        done();
      });
  });
});

describe('floating sidebar', function () {
  describe('integration', () => {
    let floatingSidebar: FloatingSidebar;
    const asyncStorage = new AsyncLocalStorage();

    beforeEach(() => {
      localStorage.removeItem(POSITION_KEY);
    });

    afterEach(() => {
      const sidebarElement = document.getElementById(SIDEBAR_ID);
      if (floatingSidebar && sidebarElement) {
        floatingSidebar.remove();
        chai.assert.isNull(document.getElementById(SIDEBAR_ID));
      }
    });

    it('init floating sidebar', (done) => {
      floatingSidebar = initFloatingSidebar({ asyncStorage });
      chai.assert.isTrue(document.getElementById(SIDEBAR_ID) instanceof Element);
      setTimeout(() => {
        done();
      }, 10);
    });

    it('restore stored position from localstorage', (done) => {
      const oldPos = {
        top: 33,
        left: 22,
        height: 456,
      };
      localStorage.setItem(POSITION_KEY, JSON.stringify(oldPos));
      floatingSidebar = initFloatingSidebar({ asyncStorage });
      setTimeout(() => {
        const sidebarElement = document.getElementById(SIDEBAR_ID) as HTMLElement;
        const { top, left } = sidebarElement.getBoundingClientRect();
        assert.equal(top, oldPos.top);
        assert.equal(left, oldPos.left);
        // Can not check height easily (without a lot of mocking), because it depends on window size.
        done();
      }, 1500);
    });

    it('restore on defaultPosition if stored position is crap', (done) => {
      localStorage.setItem(POSITION_KEY, '{');
      floatingSidebar = initFloatingSidebar({ asyncStorage });
      setTimeout(() => {
        const sidebarElement = document.getElementById(SIDEBAR_ID) as HTMLElement;
        const { top, left, height } = sidebarElement.getBoundingClientRect();
        assert.equal(top, DEFAULT_POS.top);
        assert.equal(left, DEFAULT_POS.left);
        chai.assert.ok(height > 0);
        done();
      }, 10);
    });

    it('toggle floating sidebar', (done) => {
      floatingSidebar = initFloatingSidebar({ asyncStorage });
      const sidebarElement = document.getElementById(SIDEBAR_ID);
      setTimeout(() => {
        floatingSidebar.toggleVisibility();
        assert.equal(sidebarElement!.getBoundingClientRect().width, 0);
        floatingSidebar.toggleVisibility();
        chai.assert.ok(sidebarElement!.getBoundingClientRect().width > 0);
        done();
      }, 10);
    });
  });

  describe('keepVisible', () => {
    it('reduce value that are too big', () => {
      assertDeepEqual(keepVisible({ left: 600, top: 600, height: 600 }, 500, 500), {
        left: 350,
        top: 470,
        height: 490,
      });
    });

    it('keeps valid values', () => {
      const originalPosition = { left: 600, top: 600, height: 600 };
      assertDeepEqual(keepVisible(originalPosition, 750, 700), originalPosition);
    });
  });
});
