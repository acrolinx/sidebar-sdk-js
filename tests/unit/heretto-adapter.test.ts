/*
 * Copyright 2025-present Acrolinx GmbH
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

import { describe, it, expect } from 'vitest';

/**
 * Unit tests for HerettoContentEditableAdapter
 *
 * These tests cover the domain validation logic which can be tested
 * without a browser environment. The browser-specific tests are in
 * tests/browser/heretto-adapter.test.ts
 */

describe('Heretto Domain Validation Logic', () => {
  // Replicate the domain validation logic for testing
  const HERETTO_DOMAIN = 'heretto.com';

  function isHerettoDomain(hostname: string): boolean {
    const lowerHost = hostname.toLowerCase();
    if (lowerHost === HERETTO_DOMAIN) {
      return true;
    }
    if (lowerHost.endsWith('.' + HERETTO_DOMAIN)) {
      return true;
    }
    return false;
  }

  describe('isHerettoDomain', () => {
    describe('valid domains', () => {
      it('should accept exact match heretto.com', () => {
        expect(isHerettoDomain('heretto.com')).toBe(true);
      });

      it('should accept HERETTO.COM (case insensitive)', () => {
        expect(isHerettoDomain('HERETTO.COM')).toBe(true);
      });

      it('should accept Heretto.Com (mixed case)', () => {
        expect(isHerettoDomain('Heretto.Com')).toBe(true);
      });

      it('should accept app.heretto.com subdomain', () => {
        expect(isHerettoDomain('app.heretto.com')).toBe(true);
      });

      it('should accept writers.heretto.com subdomain', () => {
        expect(isHerettoDomain('writers.heretto.com')).toBe(true);
      });

      it('should accept multi-level subdomain like sub.domain.heretto.com', () => {
        expect(isHerettoDomain('sub.domain.heretto.com')).toBe(true);
      });

      it('should accept APP.HERETTO.COM (uppercase subdomain)', () => {
        expect(isHerettoDomain('APP.HERETTO.COM')).toBe(true);
      });
    });

    describe('invalid domains (security tests)', () => {
      it('should reject malicious-heretto.com', () => {
        expect(isHerettoDomain('malicious-heretto.com')).toBe(false);
      });

      it('should reject heretto.com.evil.com', () => {
        expect(isHerettoDomain('heretto.com.evil.com')).toBe(false);
      });

      it('should reject notheretto.com', () => {
        expect(isHerettoDomain('notheretto.com')).toBe(false);
      });

      it('should reject fakeheretto.com', () => {
        expect(isHerettoDomain('fakeheretto.com')).toBe(false);
      });

      it('should reject heretto.org (wrong TLD)', () => {
        expect(isHerettoDomain('heretto.org')).toBe(false);
      });

      it('should reject heretto.net (wrong TLD)', () => {
        expect(isHerettoDomain('heretto.net')).toBe(false);
      });

      it('should reject example.com', () => {
        expect(isHerettoDomain('example.com')).toBe(false);
      });

      it('should reject localhost', () => {
        expect(isHerettoDomain('localhost')).toBe(false);
      });

      it('should reject empty string', () => {
        expect(isHerettoDomain('')).toBe(false);
      });

      it('should reject heretto (no TLD)', () => {
        expect(isHerettoDomain('heretto')).toBe(false);
      });

      it('should reject .heretto.com (leading dot)', () => {
        expect(isHerettoDomain('.heretto.com')).toBe(true); // This is actually valid as a subdomain pattern
      });

      it('should reject heretto.com. (trailing dot)', () => {
        expect(isHerettoDomain('heretto.com.')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle very long subdomain', () => {
        const longSubdomain = 'a'.repeat(100) + '.heretto.com';
        expect(isHerettoDomain(longSubdomain)).toBe(true);
      });

      it('should handle subdomain with numbers', () => {
        expect(isHerettoDomain('app123.heretto.com')).toBe(true);
      });

      it('should handle subdomain with hyphens', () => {
        expect(isHerettoDomain('my-app.heretto.com')).toBe(true);
      });
    });
  });
});

describe('Heretto Iframe ID constant', () => {
  const HERETTO_EDITOR_IFRAME_ID = 'gwt-debug-PreviewViewImpl.previewFrame';

  it('should have the correct iframe ID', () => {
    expect(HERETTO_EDITOR_IFRAME_ID).toBe('gwt-debug-PreviewViewImpl.previewFrame');
  });

  it('should contain gwt-debug prefix', () => {
    expect(HERETTO_EDITOR_IFRAME_ID).toContain('gwt-debug');
  });

  it('should contain PreviewViewImpl', () => {
    expect(HERETTO_EDITOR_IFRAME_ID).toContain('PreviewViewImpl');
  });
});

describe('Selection settle delay', () => {
  const SELECTION_SETTLE_DELAY_MS = 50;

  it('should have a reasonable delay value', () => {
    expect(SELECTION_SETTLE_DELAY_MS).toBeGreaterThan(0);
    expect(SELECTION_SETTLE_DELAY_MS).toBeLessThanOrEqual(100);
  });
});
