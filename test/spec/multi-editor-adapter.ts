import {MultiEditorAdapter} from "../../src/adapters/MultiEditorAdapter";
import {AdapterInterface, ContentExtractionResult, isSuccessfulContentExtractionResult} from "../../src/adapters/AdapterInterface";
import {Check, CheckResult, Match, MatchWithReplacement} from "../../src/acrolinx-libs/plugin-interfaces";
import {assertDeepEqual} from "../utils/test-utils";

const assert = chai.assert;

class MockedAdapter implements AdapterInterface {
  selectRangesCount = 0;
  lastSelectedRanges: Match[];

  constructor(public content = '') {
  }

  registerCheckCall(_checkInfo: Check): void {
  }

  registerCheckResult(_checkResult: CheckResult): void {
  }

  selectRanges(_checkId: string, matches: Match[]): void {
    console.log('selectedMatches', matches);
    assert.ok(this.content.length > 0, 'Adapter should not be called when it had no content while checking');
    this.selectRangesCount += 1;
    this.lastSelectedRanges = matches;
  }

  replaceRanges(_checkId: string, _matchesWithReplacement: MatchWithReplacement[]): void {
  }

  extractContentForCheck(): ContentExtractionResult {
    return {content: this.content};
  }
}

describe('multi-editor-adapter', () => {
  it('maps correctly if first adapter gets empty', async () => {
    const multiAdapter = new MultiEditorAdapter({});
    const adapter1 = new MockedAdapter('Content1');
    const adapter2Content = 'Content2';
    const adapter2 = new MockedAdapter(adapter2Content);
    multiAdapter.addSingleAdapter(adapter1);
    multiAdapter.addSingleAdapter(adapter2);

    // Check the first time when adapter 1 has some content
    const extractionResult = await multiAdapter.extractContentForCheck();
    if (!isSuccessfulContentExtractionResult(extractionResult)) {
      return assert.ok(false, 'Extraction should have no error');
    }
    assert.equal(extractionResult.content, '<div id="acrolinx_integration0">Content1</div><div id="acrolinx_integration1">Content2</div>');

    // Check the second time when adapter 1 has no content
    adapter1.content = '';
    const extractionResult2 = await multiAdapter.extractContentForCheck();
    if (!isSuccessfulContentExtractionResult(extractionResult2)) {
      return assert.ok(false, 'Extraction should have no error');
    }

    const expectedWrappedContent2 = `<div id="acrolinx_integration1">${adapter2Content}</div>`;
    assert.equal(extractionResult2.content, expectedWrappedContent2);

    const adapter2ContentPos = expectedWrappedContent2.indexOf(adapter2Content);
    multiAdapter.selectRanges('dummyCheckId', [{
      content: adapter2Content,
      range: [adapter2ContentPos, adapter2ContentPos + adapter2Content.length]
    }]);

    assert.equal(adapter2.selectRangesCount, 1, 'selectRanges of adapter2 should be called once');
    assertDeepEqual(adapter2.lastSelectedRanges, [{
      content: adapter2Content,
      range: [0, adapter2Content.length]
    }]);
  })
});

