import {MultiEditorAdapter} from "../../src/adapters/MultiEditorAdapter";

const assert = chai.assert;

describe('multi-editor-adapter', () => {
  it('getFormat returns config.aggregateFormat', () => {
    const multiAdapter = new MultiEditorAdapter({aggregateFormat: 'AUTO'});
    assert.equal(multiAdapter.getFormat(), 'AUTO');
  });

  it('getFormat returns HTML as default', () => {
    assert.equal(new MultiEditorAdapter().getFormat(), 'HTML');
  });

});

