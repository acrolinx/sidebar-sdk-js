import { Check, InitResult, Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { WorkQueue } from '../utils/work-queue';
import {
  AsyncAdapterInterface,
  AutobindWrapperAttributes,
  ContentExtractionResult,
  ExtractContentForCheckOpts,
  SuccessfulCheckResult,
} from './adapter-interface';

export class SynchronizeAsyncAdapter implements AsyncAdapterInterface {
  public readonly isAsync = true;
  public readonly requiresSynchronization = false;
  public readonly getAutobindWrapperAttributes?: () => AutobindWrapperAttributes;
  public readonly getFormat?: () => string;

  private workQueue = new WorkQueue();

  constructor(private readonly adapter: AsyncAdapterInterface) {
    if (adapter.getAutobindWrapperAttributes) {
      this.getAutobindWrapperAttributes = adapter.getAutobindWrapperAttributes.bind(adapter);
    }
    if (adapter.getFormat) {
      this.getFormat = adapter.getFormat.bind(adapter);
    }
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): ContentExtractionResult | Promise<ContentExtractionResult> {
    return this.adapter.extractContentForCheck(opts);
  }

  registerCheckCall(checkInfo: Check): void {
    return this.adapter.registerCheckCall(checkInfo);
  }

  registerCheckResult(checkResult: SuccessfulCheckResult): void {
    return this.adapter.registerCheckResult(checkResult);
  }

  selectRanges(checkId: string, matches: Match[]): Promise<void> {
    return this.workQueue.addWork(() => {
      return this.adapter.selectRanges(checkId, matches);
    });
  }

  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): Promise<void> {
    return this.workQueue.addWork(() => {
      return this.adapter.replaceRanges(checkId, matchesWithReplacement);
    });
  }

  onInitFinished(result: InitResult): void {
    if (this.adapter.onInitFinished) {
      this.adapter.onInitFinished(result);
    }
  }
}
