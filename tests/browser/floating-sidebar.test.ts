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

import { describe, beforeEach, it, afterEach, expect } from 'vitest';
import { AsyncLocalStorage } from '../../src/floating-sidebar/async-storage';
import {
  FloatingSidebar,
  POSITION_KEY,
  SIDEBAR_ID,
  initFloatingSidebar,
  DEFAULT_POS,
  keepVisible,
} from '../../src/floating-sidebar/floating-sidebar';
import { waitMs } from './utils/test-utils';

describe('async storage', () => {
  const storage = new AsyncLocalStorage();
  const testKey = 'testKey';

  beforeEach(() => {
    localStorage.removeItem(testKey);
  });

  it('set and get an object', async () => {
    const testValue = { dummy: 'foo' };
    await storage.set(testKey, testValue);
    const restoredValue = await storage.get(testKey);
    expect(restoredValue).toEqual(testValue);
  });

  it('set and get an string', async () => {
    const testValue = 'foo';
    await storage.set(testKey, testValue);
    const restoredValue = await storage.get(testKey);
    expect(restoredValue).toEqual(testValue);
  });

  it('return null for undefined keys', async () => {
    const restoredValue = await storage.get(testKey);
    expect(restoredValue).toBeNull();
  });

  it('reject promise if stored value is crap', async () => {
    await localStorage.setItem(testKey, '{');
    expect(async () => {
      await localStorage.get(testKey, '{');
    }).rejects.toThrowError();
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
        expect(document.getElementById(SIDEBAR_ID)).toBeNull();
      }
    });

    it('init floating sidebar', async () => {
      floatingSidebar = initFloatingSidebar({ asyncStorage });
      await waitMs(150);
      expect(document.getElementById(SIDEBAR_ID)).toBeInstanceOf(Element);
    });

    it('restore stored position from localstorage', async () => {
      const oldPos = {
        top: 33,
        left: 22,
        height: 456,
      };
      localStorage.setItem(POSITION_KEY, JSON.stringify(oldPos));
      floatingSidebar = initFloatingSidebar({ asyncStorage });
      await waitMs(150);
      const sidebarElement = document.getElementById(SIDEBAR_ID) as HTMLElement;
      const { top, left } = sidebarElement.getBoundingClientRect();
      expect(top).toBe(oldPos.top);
      expect(left).toBe(oldPos.left);
    });

    it('restore on defaultPosition if stored position is crap', async () => {
      localStorage.setItem(POSITION_KEY, '{');
      floatingSidebar = initFloatingSidebar({ asyncStorage });
      await waitMs(150);
      const sidebarElement = document.getElementById(SIDEBAR_ID) as HTMLElement;
      const { top, left, height } = sidebarElement.getBoundingClientRect();
      expect(top).toBe(DEFAULT_POS.top);
      expect(left).toBe(DEFAULT_POS.left);
      expect(height).toBeGreaterThan(0);
    });

    it('toggle floating sidebar', async () => {
      floatingSidebar = initFloatingSidebar({ asyncStorage });
      const sidebarElement = document.getElementById(SIDEBAR_ID);
      await waitMs(150);
      floatingSidebar.toggleVisibility();
      expect(sidebarElement!.getBoundingClientRect().width).toBe(0);
      floatingSidebar.toggleVisibility();
      expect(sidebarElement!.getBoundingClientRect().width).toBeGreaterThan(0);
    });
  });

  describe('keepVisible', () => {
    it('reduce value that are too big', () => {
      expect(keepVisible({ left: 600, top: 600, height: 600 }, 500, 500)).toEqual({
        left: 350,
        top: 470,
        height: 490,
      });
    });

    it('keeps valid values', () => {
      const originalPosition = { left: 600, top: 600, height: 600 };

      expect(keepVisible(originalPosition, 750, 700)).toEqual(originalPosition);
    });
  });
});
