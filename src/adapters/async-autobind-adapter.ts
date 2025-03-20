// While making changes here make sure if you also need to do them in synchronous version

import { Check, Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { AutobindConfig, bindAdaptersForCurrentPage } from '../autobind/autobind';
import {
  AsyncAdapterInterface,
  CommonAdapterConf,
  ExtractContentForCheckOpts,
  ContentExtractionResult,
  SuccessfulCheckResult,
} from './adapter-interface';
import { AsyncMultiEditorAdapter } from './async-multi-editor-adapter';
import { MultiEditorAdapterConfig } from './multi-editor-adapter';

// of this adapter
export class AsyncAutoBindAdapter implements AsyncAdapterInterface {
  readonly isAsync = true as const;
  readonly requiresSynchronization = true as const;
  private asyncMultiAdapter!: AsyncMultiEditorAdapter;

  constructor(private conf: MultiEditorAdapterConfig & CommonAdapterConf & AutobindConfig) {
    this.initMultiAdapter();
  }

  private initMultiAdapter() {
    this.asyncMultiAdapter = new AsyncMultiEditorAdapter(this.conf);
  }

  getFormat() {
    return this.asyncMultiAdapter.getFormat();
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): Promise<ContentExtractionResult> {
    this.initMultiAdapter();
    bindAdaptersForCurrentPage(this.conf).forEach((adapter) => {
      const wrapperAttributes = adapter.getAutobindWrapperAttributes ? adapter.getAutobindWrapperAttributes() : {};
      this.asyncMultiAdapter.addSingleAdapter(adapter, { attributes: wrapperAttributes });
    });
    return this.asyncMultiAdapter.extractContentForCheck(opts);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  registerCheckCall(_checkInfo: Check) {}

  registerCheckResult(_checkResult: SuccessfulCheckResult) {
    this.asyncMultiAdapter.registerCheckResult(_checkResult);
  }

  async selectRanges(checkId: string, matches: Match[]): Promise<void> {
    await this.asyncMultiAdapter.selectRanges(checkId, matches);
  }

  async replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): Promise<void> {
    await this.asyncMultiAdapter.replaceRanges(checkId, matchesWithReplacement);
  }
}
