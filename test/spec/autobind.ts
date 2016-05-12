/// <reference path="../utils/test-utils.ts" />


namespace acrolinx.test.autobind {

  import assertDeepEqual = acrolinx.test.utils.assertDeepEqual;
  describe('autobind', function () {
    const containerDivId = 'autoBindTest';

    function setPageContent(html: string) {
      $('#' + containerDivId).html(html);
    }

    beforeEach(() => {
      $('body').append(`<div id="${containerDivId}"></div>`);
    });

    afterEach(() => {
      $('#' + containerDivId).remove();
    });


    it('binds all adapters', () => {
      setPageContent(`
          <input id="input1" value="input 1 content" />
          <div id="ContentEditableAdapter" contenteditable="true">contentEditable content</div>
          <textarea id="InputAdapter">textarea content</textarea>
          <input id="input2" type="" value="input 2 content" />
          <input id="input3" type="text" value="input 3 content" />
          <input type="checkbox" value="We must ignore a checkbox." />
          <iframe id="autoBindTestIFrame" src=""></iframe>
      `);

      $('#autoBindTestIFrame').contents().find('html')
        .html(`<input id="inputInIFrame" type="text" value="input in iframe content" />`);

      const adapters = acrolinx.plugins.autobind.bindAdaptersForCurrentPage();
      assert.equal(adapters.length, 6);

      const adaptersContent = adapters.map(a => a.getContent());
      assert.equal(adaptersContent[0], 'input 1 content');
      assert.equal(adaptersContent[1], 'contentEditable content');
      assert.equal(adaptersContent[2], 'textarea content');
      assert.equal(adaptersContent[3], 'input 2 content');
      assert.equal(adaptersContent[4], 'input 3 content');
      assert.equal(adaptersContent[5], 'input in iframe content');
    });

    // This test depends on an available internet.
    it('ignore iframes from other domains ', (done) => {
      setPageContent(`
          <input id="input 1" type="" value="input 1 content" />
          <!-- Just an example for a page from a different domain. -->
          <iframe id="iframeFromOtherDomain" src="http://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/master/samples/autobind/iframe-different-domain.html"></iframe>
          <input id="input 2" type="" value="input 2 content" />
      `);

      $('#iframeFromOtherDomain').on('load', () => {
        const adapters = acrolinx.plugins.autobind.bindAdaptersForCurrentPage();
        assert.equal(adapters.length, 2);

        const adaptersContent = adapters.map(a => a.getContent());
        assert.equal(adaptersContent[0], 'input 1 content');
        assert.equal(adaptersContent[1], 'input 2 content');
        done();
      });

    });


  });
}