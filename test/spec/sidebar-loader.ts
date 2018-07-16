import {grepAttributeValues, rebaseRelativeUrl, rebaseRelativeUrls} from "../../src/utils/sidebar-loader";
import {assertDeepEqual} from "../utils/test-utils";

const assert = chai.assert;

describe('sidebar-loader', () => {
  const RELATIVE_HREF = 'start <a href="https://bla.com/file.css"/> <link href="file2.css"/> end';
  const ABSOLUTE_HREF_HTTP = 'start <link href="http://bla.com/file.css"/> <link href="file2.css"/> end';
  const ABSOLUTE_HREF_HTTPS = 'start <link href="https://bla.com/file.css"/> <link href="file2.css"/> end';

  const RELATIVE_SRC = 'start <script src="file.js"></script> <script src="file2.js"></script> end';
  const ABSOLUTE_SRC_HTTP = 'start <script src="http://bla.com/file.js"></script> <script src="file2.js"></script> end';
  const ABSOLUTE_SRC_HTTPS = 'start <script src="https://bla.com/file.js"></script> <script src="file2.js"></script> end';

  const DUMMY_HOST = 'http://host.com/';

  describe('replaceRelativeUrls', () => {

    describe('src', () => {
        it('ignores absolute src https', () => {
          assert.equal(
            rebaseRelativeUrls(RELATIVE_SRC, DUMMY_HOST),
            'start <script src="http://host.com/file.js"></script> <script src="http://host.com/file2.js"></script> end');
        });

        it('ignores absolute src http', () => {
          assert.equal(
            rebaseRelativeUrls(ABSOLUTE_SRC_HTTP, DUMMY_HOST),
            'start <script src="http://bla.com/file.js"></script> <script src="http://host.com/file2.js"></script> end');
        });

        it('replaces relative src', () => {
          assert.equal(
            rebaseRelativeUrls(ABSOLUTE_SRC_HTTPS, DUMMY_HOST),
            'start <script src="https://bla.com/file.js"></script> <script src="http://host.com/file2.js"></script> end');
        });
      }
    );

    describe('href', () => {
        it('replaces relative href', () => {
          assert.equal(
            rebaseRelativeUrls(RELATIVE_HREF, DUMMY_HOST),
            'start <a href="https://bla.com/file.css"/> <link href="http://host.com/file2.css"/> end');
        });

        it('ignores absolute href http', () => {
          assert.equal(
            rebaseRelativeUrls(ABSOLUTE_HREF_HTTP, DUMMY_HOST),
            'start <link href="http://bla.com/file.css"/> <link href="http://host.com/file2.css"/> end');
        });

        it('ignores absolute href https', () => {
          assert.equal(
            rebaseRelativeUrls(ABSOLUTE_HREF_HTTPS, DUMMY_HOST),
            'start <link href="https://bla.com/file.css"/> <link href="http://host.com/file2.css"/> end');
        });
      }
    );


  });

  describe('grepAttributeValues', () => {
    it('src', () => {
      assertDeepEqual(grepAttributeValues(ABSOLUTE_SRC_HTTP, 'src'),
        ['http://bla.com/file.js', 'file2.js']
      );
    });
    it('href', () => {
      assertDeepEqual(grepAttributeValues(ABSOLUTE_HREF_HTTP, 'href'),
          ['http://bla.com/file.css', 'file2.css']
      );
    });
  });

  describe('rebaseRelativeUrl', () => {
    it('relative url', () => {
      assertDeepEqual(rebaseRelativeUrl('file.js', DUMMY_HOST), 'http://host.com/file.js');
    });

    it('keep absolute url', () => {
      assertDeepEqual(rebaseRelativeUrl('http://bla.com/file.js', DUMMY_HOST), 'http://bla.com/file.js');
      assertDeepEqual(rebaseRelativeUrl('https://bla.com/file.js', DUMMY_HOST), 'https://bla.com/file.js');
    });
  });
});

