import { Check, Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { AutobindConfig, bindAdaptersForCurrentPage } from '../autobind/autobind';
import {
  AdapterInterface,
  CommonAdapterConf,
  ContentExtractionResult,
  ExtractContentForCheckOpts,
  SuccessfulCheckResult,
} from './adapter-interface';
import { MultiEditorAdapter, MultiEditorAdapterConfig } from './multi-editor-adapter';

// While making changes here make sure if you also need to do them in asynchronous version
// of this adapter
export class AutoBindAdapter implements AdapterInterface {
  private multiAdapter!: MultiEditorAdapter;

  constructor(private conf: MultiEditorAdapterConfig & CommonAdapterConf & AutobindConfig) {
    this.initMultiAdapter();
  }

  private initMultiAdapter() {
    this.multiAdapter = new MultiEditorAdapter(this.conf);
  }

  getFormat() {
    return this.multiAdapter.getFormat();
  }

  extractContentForCheck(opts: ExtractContentForCheckOpts): Promise<ContentExtractionResult> {
    this.initMultiAdapter();
    bindAdaptersForCurrentPage(this.conf).forEach((adapter) => {
      const wrapperAttributes = adapter.getAutobindWrapperAttributes ? adapter.getAutobindWrapperAttributes() : {};
      this.multiAdapter.addSingleAdapter(adapter, { attributes: wrapperAttributes });
    });
    return this.multiAdapter.extractContentForCheck(opts);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  registerCheckCall(_checkInfo: Check) {}

  registerCheckResult(_checkResult: SuccessfulCheckResult) {
    this.multiAdapter.registerCheckResult(_checkResult);
  }

  selectRanges(checkId: string, matches: Match[]) {
    this.multiAdapter.selectRanges(checkId, matches);
  }

  replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]) {
    this.multiAdapter.replaceRanges(checkId, matchesWithReplacement);
  }
}
