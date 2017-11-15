const assert = chai.assert;

import {
  initFloatingSidebar,
  SIDEBAR_ID,
  FloatingSidebar,
  keepVisible,
  POSITION_KEY,
  DEFAULT_POS
} from "../../src/floating-sidebar/floating-sidebar";
import {assertDeepEqual} from "../utils/test-utils";
import {AsyncLocalStorage} from "../../src/floating-sidebar/async-storage";

describe('async storage', () => {
  const storage = new AsyncLocalStorage();
  const testKey = 'testKey';

  beforeEach(() => {
    localStorage.removeItem(testKey);
  });

  it('set and get an object', (done) => {
    const testValue = {dummy: 'foo'};
    storage.set(testKey, testValue).then(() => {
        storage.get(testKey).then(restoredValue => {
          assertDeepEqual(restoredValue, testValue);
          done();
        }).catch(done);
      }
    );
  });

  it('set and get an string', (done) => {
    const testValue = 'foo';
    storage.set(testKey, testValue).then(() => {
        storage.get(testKey).then(restoredValue => {
          assertDeepEqual(restoredValue, testValue);
          done();
        }).catch(done);
      }
    );
  });

  it('return null for undefined keys', (done) => {
    storage.get(testKey).then(restoredValue => {
      assert.isNull(restoredValue);
      done();
    }).catch(done);
  });

  it('reject promise if stored value is crap', (done) => {
    localStorage.setItem(testKey, '{');
    storage.get(testKey).then(_restoredValue => {
      done('Should be rejected');
    }).catch(() => {
      done();
    });
  });
});

describe('floating sidebar', function () {

  describe('integration', () => {
    let floatingSidebar: FloatingSidebar;
    let asyncStorage = new AsyncLocalStorage();

    beforeEach(() => {
      localStorage.removeItem(POSITION_KEY);
    });

    afterEach(() => {
      const sidebarElement = document.getElementById(SIDEBAR_ID);
      if (floatingSidebar && sidebarElement) {
        floatingSidebar.remove();
        assert.isNull(document.getElementById(SIDEBAR_ID));
      }
    });

    it('init floating sidebar', (done) => {
      floatingSidebar = initFloatingSidebar({asyncStorage});
      assert.isTrue(document.getElementById(SIDEBAR_ID) instanceof Element);
      setTimeout(() => {
        done();
      }, 10);
    });

    it('restore stored position from localstorage', (done) => {
      const oldPos = {
        top: 33,
        left: 22,
        height: 456
      };
      localStorage.setItem(POSITION_KEY, JSON.stringify(oldPos));
      floatingSidebar = initFloatingSidebar({asyncStorage});
      setTimeout(() => {
        const sidebarElement = document.getElementById(SIDEBAR_ID) as HTMLElement;
        const {top, left} = sidebarElement.getBoundingClientRect();
        assert.equal(top, oldPos.top);
        assert.equal(left, oldPos.left);
        // Can not check height easily (without a lot of mocking), because it depends on window size.
        done();
      }, 10);
    });

    it('restore on defaultPosition if stored position is crap', (done) => {
      localStorage.setItem(POSITION_KEY, '{');
      floatingSidebar = initFloatingSidebar({asyncStorage});
      setTimeout(() => {
        const sidebarElement = document.getElementById(SIDEBAR_ID) as HTMLElement;
        const {top, left, height} = sidebarElement.getBoundingClientRect();
        assert.equal(top, DEFAULT_POS.top);
        assert.equal(left, DEFAULT_POS.left);
        assert.ok(height > 0);
        done();
      }, 10);
    });

    it('toggle floating sidebar', (done) => {
      floatingSidebar = initFloatingSidebar({asyncStorage});
      const sidebarElement = document.getElementById(SIDEBAR_ID);
      setTimeout(() => {
        floatingSidebar.toggleVisibility();
        assert.equal(sidebarElement!.getBoundingClientRect().width, 0);
        floatingSidebar.toggleVisibility();
        assert.ok(sidebarElement!.getBoundingClientRect().width > 0);
        done();
      }, 10);
    });

  });

  describe('keepVisible', () => {
    it('reduce value that are too big', () => {
      assertDeepEqual(keepVisible({left: 600, top: 600, height: 600}, 500, 500), {
        "left": 350,
        "top": 470,
        "height": 490
      });
    });

    it('keeps valid values', () => {
      const originalPosition = {left: 600, top: 600, height: 600};
      assertDeepEqual(keepVisible(originalPosition, 750, 700), originalPosition);
    });

  });

});


