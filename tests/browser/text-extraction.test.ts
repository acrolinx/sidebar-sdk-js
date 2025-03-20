import { describe, it, expect } from 'vitest';
import { findNewIndex } from '../../src/utils/alignment';
import { extractTextDomMapping } from '../../src/utils/text-dom-mapping';
import { extractText } from '../../src/utils/text-extraction';
import fc from 'fast-check';
import * as entities from 'entities';

describe('text-extraction', () => {
  describe('extractText', () => {
    it('2 tags', () => {
      const html = '01<t/>67<li/>34';
      const [text, offsetMapping] = extractText(html);

      expect(text).toBe('016734');

      expect(findNewIndex(offsetMapping, 0)).toBe(0);
      expect(findNewIndex(offsetMapping, 1)).toBe(1);
      expect(findNewIndex(offsetMapping, 6)).toBe(6 - 4);
      expect(findNewIndex(offsetMapping, 7)).toBe(7 - 4);
      expect(findNewIndex(offsetMapping, 13)).toBe(13 - 9);
      expect(findNewIndex(offsetMapping, 14)).toBe(14 - 9);
    });

    it('inline tags', () => {
      expect(extractText('1<b>2</b>3')[0]).toBe('123');
    });

    it('line breaking end-tags', () => {
      expect(extractText('<p>1</p>2')[0]).toBe('1\n2');
    });

    it('line breaking self closing tags', () => {
      expect(extractText('1<br/>2')[0]).toBe('1\n2');
    });

    it('line breaking auto self closing tags', () => {
      expect(extractText('1<br>2')[0]).toBe('1\n2');
    });

    it('entities', () => {
      const html = '0&amp;1';
      const [text] = extractText(html);
      expect(text).toBe('0&1');
    });

    it('replace scripts with empty string', () => {
      const html = '1<script>2</script>3';
      const [text, offsetMapping] = extractText(html);

      expect(text).toBe('13');

      expect(findNewIndex(offsetMapping, 0)).toBe(0);
      expect(findNewIndex(offsetMapping, html.indexOf('3'))).toBe(1);
    });

    it('replace complicated scripts with empty string', () => {
      // We can't handle <script type="text/javascript">alert("</script>")</script> yet.
      const html = '1<script type="text/javascript">alert("<script>");\n</script>3';
      const [text] = extractText(html);
      expect(text).toBe('13');
    });

    it('replace style with empty string', () => {
      expect(extractText('1<style>2</style>3')[0]).toBe('13');
    });
  });

  describe('extractText and extractTextDomMapping should return the same text', () => {
    function assertSameExtractedText(html: string) {
      const htmlElement = toHtmlElement(html);
      const textDomMapping = extractTextDomMapping(htmlElement);
      const [text] = extractText(htmlElement.innerHTML);
      expect(textDomMapping.text).toBe(text);
    }

    function toHtmlElement(html: string) {
      const el = document.createElement('div');
      el.innerHTML = html;
      return el;
    }

    it('fixed cases', () => {
      assertSameExtractedText('01<t/>67<li/>34');
      assertSameExtractedText('0&amp;1');
      assertSameExtractedText('1<script>2</script>3');
      assertSameExtractedText('1<style>2</style>3');
      assertSameExtractedText('1<b>2</b>3');
      assertSameExtractedText('<p>1</p>2');
      assertSameExtractedText('1<br/>2');
      assertSameExtractedText('1<br>2');
      assertSameExtractedText('13');
    });

    it('fixed weird cases', () => {
      assertSameExtractedText('</\u0000');
    });

    it('random strings', () => {
      const JS_VERIFY_OPTS = {
        tests: 1000,
        rngState: '0123456789abcdef01',
      };

      const FAST_CHECK_OPTS = {
        numRuns: JS_VERIFY_OPTS.tests,
        seed: parseInt(JS_VERIFY_OPTS.rngState, 16),
      };

      fc.assert(
        fc.property(fc.string(), (html: string) => {
          const htmlElement = toHtmlElement(html);
          const textDomMapping = extractTextDomMapping(htmlElement);
          const [text] = extractText(htmlElement.innerHTML);
          return textDomMapping.text === text;
        }),
        FAST_CHECK_OPTS,
      );
    });
  });

  describe('entities.decodeHTMLStrict', () => {
    /**
     * Formerly we used this DOM based entity decoding.
     */
    function decodeEntityOld(entity: string): string {
      const el = document.createElement('div');
      el.innerHTML = entity;
      return el.textContent || '';
    }

    const executionCount = 10000;
    const testEntities = '&amp;';
    const expectedDecodedEntities = `&`;

    it.skip('should be faster then the old DOM based code', () => {
      const startTimeOld = Date.now();
      for (let i = 0; i < executionCount; i++) {
        expect(decodeEntityOld(testEntities)).toBe(expectedDecodedEntities);
      }
      const durationOld = Date.now() - startTimeOld;

      const startTimeNew = Date.now();
      for (let i = 0; i < executionCount; i++) {
        expect(entities.decodeHTMLStrict(testEntities)).toBe(expectedDecodedEntities);
      }
      const durationNew = Date.now() - startTimeNew;

      expect(durationNew).toBeLessThan(durationOld);
    });
  });
});
