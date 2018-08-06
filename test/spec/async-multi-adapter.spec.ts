import {MatchWithReplacement} from "../../src/acrolinx-libs/plugin-interfaces";
import {SuccessfulContentExtractionResult} from "../../src/adapters/AdapterInterface";
import {AsyncMultiEditorAdapter} from "../../src/adapters/AsyncMultiEditorAdapter";
import {getMatchesWithReplacement, waitMs} from "../utils/test-utils";
import {FakeAdapter} from "./fake/FakeAdapter";
import {SlowMotionAsyncWrapper} from "./fake/SlowMotionAsyncAdapter";

const assert = chai.assert;

const DELAY_IN_MS = 10;
const DUMMY_CHECK_ID = 'dummyCheckId';

describe('AsyncMultiEditorAdapter', () => {
  let childAdapter1: FakeAdapter;
  let childAdapter2: FakeAdapter;
  let amea: AsyncMultiEditorAdapter;
  let overlappingMatches: MatchWithReplacement[];

  beforeEach(async () => {
    // Setup AsyncMultiEditorAdapter with 2 child adapters
    childAdapter1 = new FakeAdapter('start1 end1');
    childAdapter2 = new FakeAdapter('start2 end2');
    amea = new AsyncMultiEditorAdapter();
    amea.addSingleAdapter(new SlowMotionAsyncWrapper(childAdapter1, DELAY_IN_MS));
    amea.addSingleAdapter(new SlowMotionAsyncWrapper(childAdapter2, DELAY_IN_MS));

    // Simulate check
    const contentResult = await amea.extractContentForCheck({}) as SuccessfulContentExtractionResult;
    const content = contentResult.content;
    amea.registerCheckResult({checkedPart: {checkId: DUMMY_CHECK_ID, range: [0, content.length]}});

    // Match over last word of childAdapter1 to first word of childAdapter2
    overlappingMatches = getMatchesWithReplacement(content, 'end1', 'end1X')
      .concat(getMatchesWithReplacement(content, 'start2', 'start2X'));
  });

  it('should synchronize selections over multiple children', async () => {
    const promise = amea.selectRanges(DUMMY_CHECK_ID, overlappingMatches);
    // nothing selected yet
    assert.isUndefined(childAdapter1.selection);
    assert.isUndefined(childAdapter2.selection);

    await waitMs(DELAY_IN_MS);
    // selection in first child applied
    assert.deepEqual(childAdapter1.selection!.ranges, [[7, 11]]);
    assert.isUndefined(childAdapter2.selection);

    await waitMs(DELAY_IN_MS);
    // all selections applied
    assert.deepEqual(childAdapter1.selection!.ranges, [[7, 11]]);
    assert.deepEqual(childAdapter2.selection!.ranges, [[0, 6]]);

    await promise;
  });

  it('should synchronize replacements over multiple children', async () => {
    const promise = amea.replaceRanges(DUMMY_CHECK_ID, overlappingMatches);
    // nothing replaces yet
    assert.equal(childAdapter1.content, 'start1 end1');
    assert.equal(childAdapter2.content, 'start2 end2');

    await waitMs(DELAY_IN_MS);
    // replacements in first child done
    assert.equal(childAdapter1.content, 'start1 end1X');
    assert.equal(childAdapter2.content, 'start2 end2');

    await waitMs(DELAY_IN_MS);
    // all replacements done
    assert.equal(childAdapter1.content, 'start1 end1X');
    assert.equal(childAdapter2.content, 'start2X end2');

    await promise;
  });
});