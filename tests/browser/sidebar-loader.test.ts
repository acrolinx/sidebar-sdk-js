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

import { describe, it, expect } from 'vitest';
import { rebaseRelativeUrls, grepAttributeValues, rebaseRelativeUrl } from '../../src/utils/sidebar-loader';

describe('sidebar-loader', () => {
  const RELATIVE_HREF = 'start <a href="https://bla.com/file.css"/> <link href="file2.css"/> end';
  const ABSOLUTE_HREF_HTTP = 'start <link href="http://bla.com/file.css"/> <link href="file2.css"/> end';
  const ABSOLUTE_HREF_HTTPS = 'start <link href="https://bla.com/file.css"/> <link href="file2.css"/> end';

  const RELATIVE_SRC = 'start <script src="file.js"></script> <script src="file2.js"></script> end';
  const ABSOLUTE_SRC_HTTP = 'start <script src="http://bla.com/file.js"></script> <script src="file2.js"></script> end';
  const ABSOLUTE_SRC_HTTPS =
    'start <script src="https://bla.com/file.js"></script> <script src="file2.js"></script> end';

  const DUMMY_HOST = 'http://host.com/';

  describe('replaceRelativeUrls', () => {
    describe('src', () => {
      it('ignores absolute src https', () => {
        expect(rebaseRelativeUrls(RELATIVE_SRC, DUMMY_HOST)).toBe(
          'start <script src="http://host.com/file.js"></script> <script src="http://host.com/file2.js"></script> end',
        );
      });

      it('ignores absolute src http', () => {
        expect(rebaseRelativeUrls(ABSOLUTE_SRC_HTTP, DUMMY_HOST)).toBe(
          'start <script src="http://bla.com/file.js"></script> <script src="http://host.com/file2.js"></script> end',
        );
      });

      it('replaces relative src', () => {
        expect(rebaseRelativeUrls(ABSOLUTE_SRC_HTTPS, DUMMY_HOST)).toBe(
          'start <script src="https://bla.com/file.js"></script> <script src="http://host.com/file2.js"></script> end',
        );
      });
    });

    describe('href', () => {
      it('replaces relative href', () => {
        expect(rebaseRelativeUrls(RELATIVE_HREF, DUMMY_HOST)).toBe(
          'start <a href="https://bla.com/file.css"/> <link href="http://host.com/file2.css"/> end',
        );
      });

      it('ignores absolute href http', () => {
        expect(rebaseRelativeUrls(ABSOLUTE_HREF_HTTP, DUMMY_HOST)).toBe(
          'start <link href="http://bla.com/file.css"/> <link href="http://host.com/file2.css"/> end',
        );
      });

      it('ignores absolute href https', () => {
        expect(rebaseRelativeUrls(ABSOLUTE_HREF_HTTPS, DUMMY_HOST)).toBe(
          'start <link href="https://bla.com/file.css"/> <link href="http://host.com/file2.css"/> end',
        );
      });
    });
  });

  describe('grepAttributeValues', () => {
    it('src', () => {
      expect(grepAttributeValues(ABSOLUTE_SRC_HTTP, 'src')).toEqual(['http://bla.com/file.js', 'file2.js']);
    });
    it('href', () => {
      expect(grepAttributeValues(ABSOLUTE_HREF_HTTP, 'href')).toEqual(['http://bla.com/file.css', 'file2.css']);
    });
  });

  describe('rebaseRelativeUrl', () => {
    it('relative url', () => {
      expect(rebaseRelativeUrl('file.js', DUMMY_HOST)).toEqual('http://host.com/file.js');
    });

    it('keep absolute url', () => {
      expect(rebaseRelativeUrl('http://bla.com/file.js', DUMMY_HOST)).toEqual('http://bla.com/file.js');
      expect(rebaseRelativeUrl('https://bla.com/file.js', DUMMY_HOST)).toEqual('https://bla.com/file.js');
    });
  });
});
