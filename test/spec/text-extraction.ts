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

import * as entities from 'entities';
import * as jsc from 'jsverify';
import {findNewIndex} from '../../src/utils/alignment';
import {extractTextDomMapping} from '../../src/utils/text-dom-mapping';
import {extractText} from '../../src/utils/text-extraction';

const assert = chai.assert;


describe('text-extraction', () => {
  describe('extractText', () => {
    it('2 tags', () => {
      const html = '01<t/>67<li/>34';
      const [text, offsetMapping] = extractText(html);

      assert.equal(text, '016734');

      assert.equal(findNewIndex(offsetMapping, 0), 0);
      assert.equal(findNewIndex(offsetMapping, 1), 1);
      assert.equal(findNewIndex(offsetMapping, 6), 6 - 4);
      assert.equal(findNewIndex(offsetMapping, 7), 7 - 4);
      assert.equal(findNewIndex(offsetMapping, 13), 13 - 9);
      assert.equal(findNewIndex(offsetMapping, 14), 14 - 9);
    });

    it('inline tags', () => {
      assert.equal(extractText('1<b>2</b>3')[0], '123');
    });

    it('line breaking end-tags', () => {
      assert.equal(extractText('<p>1</p>2')[0], '1\n2');
    });

    it('line breaking self closing tags', () => {
      assert.equal(extractText('1<br/>2')[0], '1\n2');
    });

    it('line breaking auto self closing tags', () => {
      assert.equal(extractText('1<br>2')[0], '1\n2');
    });

    it('entities', () => {
      const html = '0&amp;1';
      const [text] = extractText(html);
      assert.equal(text, '0&1');
    });


    it('replace scripts with empty string', () => {
      const html = '1<script>2</script>3';
      const [text, offsetMapping] = extractText(html);

      assert.equal(text, '13');

      assert.equal(findNewIndex(offsetMapping, 0), 0);
      assert.equal(findNewIndex(offsetMapping, html.indexOf('3')), 1);
    });

    it('replace complicated scripts with empty string', () => {
      // We can't handle <script type="text/javascript">alert("</script>")</script> yet.
      const html = '1<script type="text/javascript">alert("<script>");\n</script>3';
      const [text] = extractText(html);
      assert.equal(text, '13');
    });

    it('replace style with empty string', () => {
      assert.equal(extractText('1<style>2</style>3')[0], '13');
    });

  });


  describe('extractText and extractTextDomMapping should return the same text', () => {
    function assertSameExtractedText(html: string, message?: string) {
      const htmlElement = toHtmlElement(html);
      const textDomMapping = extractTextDomMapping(htmlElement);
      const [text] = extractText(htmlElement.innerHTML);
      assert.equal(textDomMapping.text, text, message);
    }

    function toHtmlElement(html: string) {
      const el = document.createElement('div');
      el.innerHTML = html;
      return el;
    }

    it('fixed cases', () => {
      assertSameExtractedText('01<t/>67<li/>34', 'remove 2 tags');
      assertSameExtractedText('0&amp;1', 'replace entity');
      assertSameExtractedText('1<script>2</script>3', 'remove scripts');
      assertSameExtractedText('1<style>2</style>3', 'remove styles');
      assertSameExtractedText('1<b>2</b>3', 'inline tag');
      assertSameExtractedText('<p>1</p>2', 'line breaking end-tags');
      assertSameExtractedText('1<br/>2', 'line breaking self closing tags');
      assertSameExtractedText('1<br>2', 'line breaking auto self closing tags');
      assertSameExtractedText('1<!--2-->3', 'comments');
    });

    it('fixed weird cases', () => {
      assertSameExtractedText('</\u0000', 'this ends up as a comment');
    });

    it('random strings', function(this: any) {
      this.timeout(2000);

      const JS_VERIFY_OPTS = {
        tests: 1000,
        rngState: '0123456789abcdef01'
      };

      jsc.assert(jsc.forall('string',
        (html: string) => {
          const htmlElement = toHtmlElement(html);
          const textDomMapping = extractTextDomMapping(htmlElement);
          const [text] = extractText(htmlElement.innerHTML);
          return textDomMapping.text === text;
        }
      ), JS_VERIFY_OPTS);
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

    it('should be faster then the old DOM based code', () => {
      const startTimeOld = Date.now();
      for (let i = 0; i < executionCount; i++) {
        assert.equal(decodeEntityOld(testEntities), expectedDecodedEntities);
      }
      const durationOld = Date.now() - startTimeOld;

      const startTimeNew = Date.now();
      for (let i = 0; i < executionCount; i++) {
        assert.equal(entities.decodeHTMLStrict(testEntities), expectedDecodedEntities);
      }
      const durationNew = Date.now() - startTimeNew;

      assert.ok(durationNew < durationOld);
    });
  });
});

