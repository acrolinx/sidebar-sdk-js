import { MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { describe, beforeEach, it, expect, assert } from 'vitest';
import { SuccessfulContentExtractionResult } from '../../src/adapters/adapter-interface';
import { FakeAdapter } from './fake/fake-adapter';
import { SlowMotionAsyncWrapper } from './fake/slowmotion-async-adapter';
import { getMatchesWithReplacement, waitMs } from './utils/test-utils';
import { AsyncMultiEditorAdapter } from '../../src/adapters/async-multi-editor-adapter';

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
    const contentResult = (await amea.extractContentForCheck({})) as SuccessfulContentExtractionResult;
    const content = contentResult.content;
    amea.registerCheckResult({ checkedPart: { checkId: DUMMY_CHECK_ID, range: [0, content.length] } });

    // Match over last word of childAdapter1 to first word of childAdapter2
    overlappingMatches = getMatchesWithReplacement(content, 'end1', 'end1X').concat(
      getMatchesWithReplacement(content, 'start2', 'start2X'),
    );
  });

  it('should synchronize selections over multiple children', async () => {
    const promise = amea.selectRanges(DUMMY_CHECK_ID, overlappingMatches);
    // nothing selected yet
    expect(childAdapter1.selection).toBeUndefined();
    expect(childAdapter2.selection).toBeUndefined();

    await waitMs(DELAY_IN_MS);
    // selection in first child applied
    assert.deepEqual(childAdapter1.selection!.ranges, [[7, 11]]);
    expect(childAdapter2.selection).toBeUndefined();

    await waitMs(DELAY_IN_MS);
    // all selections applied
    assert.deepEqual(childAdapter1.selection!.ranges, [[7, 11]]);
    assert.deepEqual(childAdapter2.selection!.ranges, [[0, 6]]);

    await promise;
  });

  it('should synchronize replacements over multiple children', async () => {
    const promise = amea.replaceRanges(DUMMY_CHECK_ID, overlappingMatches);
    // nothing replaces yet
    expect(childAdapter1.content).toEqual('start1 end1');
    expect(childAdapter2.content).toEqual('start2 end2');

    await waitMs(DELAY_IN_MS);
    // replacements in first child done
    expect(childAdapter1.content).toEqual('start1 end1X');
    expect(childAdapter2.content).toEqual('start2 end2');

    await waitMs(DELAY_IN_MS);
    // all replacements done
    expect(childAdapter1.content).toEqual('start1 end1X');
    expect(childAdapter2.content).toEqual('start2X end2');

    await promise;
  });
});
