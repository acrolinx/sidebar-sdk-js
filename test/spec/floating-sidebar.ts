import assert = chai.assert;

import {
  initFloatingSidebar,
  SIDEBAR_ID,
  FloatingSidebar,
  keepVisible
} from "../../src/floating-sidebar/floating-sidebar";
import {assertDeepEqual} from "../utils/test-utils";
import {AsyncLocalStorage} from "../../src/floating-sidebar/async-storage";

describe('floating sidebar', function () {

  describe('integration', () => {
    let floatingSidebar: FloatingSidebar;
    let asyncStorage = new AsyncLocalStorage();

    afterEach(() => {
      const sidebarElement = document.getElementById(SIDEBAR_ID)
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
    })

  });

});


