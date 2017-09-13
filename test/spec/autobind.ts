import * as _ from "lodash";
const assert = chai.assert;
import {bindAdaptersForCurrentPage} from "../../src/autobind/autobind";
import {AutoBindAdapter} from "../../src/adapters/AutoBindAdapter";
import {hasError} from "../../src/adapters/AdapterInterface";

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

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 6);

    const adaptersContent = adapters.map(a => a.getContent!());
    assert.equal(adaptersContent[0], 'input 1 content');
    assert.equal(adaptersContent[1], 'contentEditable content');
    assert.equal(adaptersContent[2], 'textarea content');
    assert.equal(adaptersContent[3], 'input 2 content');
    assert.equal(adaptersContent[4], 'input 3 content');
    assert.equal(adaptersContent[5], 'input in iframe content');
  });

  // This test depends on an available internet.
  it('ignore iframes from other domains ', function (this: any, done: MochaDone) {
    this.timeout(5000);

    setPageContent(`
          <input id="input 1" type="" value="input 1 content" />
          <!-- Just an example for a page from a different domain. -->
          <iframe id="iframeFromOtherDomain" src="http://cdn.rawgit.com/acrolinx/acrolinx-sidebar-demo/master/samples/autobind/iframe-different-domain.html"></iframe>
          <input id="input 2" type="" value="input 2 content" />
      `);

    const onLoadedOnce = _.once(() => {
      const adapters = bindAdaptersForCurrentPage();
      assert.equal(adapters.length, 2);

      const adaptersContent = adapters.map(a => a.getContent!());
      assert.equal(adaptersContent[0], 'input 1 content');
      assert.equal(adaptersContent[1], 'input 2 content');
      done();
    });

    $('#iframeFromOtherDomain').on('load', onLoadedOnce);
    setTimeout(onLoadedOnce, 3000);

  });

  it('dont bind readonly fields', () => {
    setPageContent(`
          <input readonly/>
          <textarea readonly></textarea>
      `);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 0);
  });

  it('dont bind fields that are probably comboboxes', () => {
    setPageContent(`
          <input role="combobox" autocomplete="off"/>
          <input role="combobox" autocomplete="false"/>
          <textarea role="combobox" autocomplete="off"/></textarea>
      `);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 0);
  });

  it('bind input field that looks a bit like a combobox but is not really', () => {
    // Such pseudo-comboboxes can be found on https://web.skype.com
    setPageContent(`
          <input role="combobox" />
      `);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 1);
  });

  it('dont bind probable search fields', () => {
    setPageContent(`
          <input role="search"/>
          <input name="q" autocomplete="off"/>
          <input name="search_query" autocomplete="off"/>
      `);

    const adapters = bindAdaptersForCurrentPage();
    assert.equal(adapters.length, 0);
  });


  describe('AutoBindAdapter', () => {
    it('uses wrapper attributes from adapters', (done) => {
      setPageContent(`
          <input id="inputId" class="inputClass" name="inputName" value="text"/>
          <div id="divId" class="divClass" contenteditable="true">html</div>
      `);

      const autobindAdapter = new AutoBindAdapter({});
      const extractedContent = autobindAdapter.extractContentForCheck({});
      extractedContent.then(result => {
        if (hasError(result)) {
          done(result.error);
          return;
        }
        assert.equal(result.content,
          '<div original-id="inputId" original-class="inputClass" original-name="inputName" original-source="input" id="acrolinx_integration0">text</div>' +
          '<div original-id="divId" original-class="divClass" original-source="div" id="acrolinx_integration1">html</div>'
        );
        done();
      }).catch(done);
    });

    it('returns format of inner MultiEditor ', () => {
      const autobindAdapterAuto = new AutoBindAdapter({aggregateFormat: 'AUTO'});
      assert.equal(autobindAdapterAuto.getFormat(), 'AUTO');

      const autobindAdapterHtml = new AutoBindAdapter({aggregateFormat: 'HTML'});
      assert.equal(autobindAdapterHtml.getFormat(), 'HTML');
    });


  });

});