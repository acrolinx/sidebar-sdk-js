import { Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { AdapterInterface, AsyncAdapterInterface } from './adapter-interface';
import { AddSingleAdapterOptions, MultiEditorAdapter } from './multi-editor-adapter';

export class AsyncMultiEditorAdapter extends MultiEditorAdapter implements AsyncAdapterInterface {
  readonly isAsync = true as const;
  readonly requiresSynchronization = true as const;

  addSingleAdapter(
    singleAdapter: AsyncAdapterInterface | AdapterInterface,
    opts: AddSingleAdapterOptions = {},
    id?: string,
  ) {
    this.addSingleAdapterInternal(singleAdapter, opts, id);
  }

  async selectRanges(checkId: string, matches: Match[]): Promise<void> {
    const map = this.remapMatches(matches);
    for (const id in map) {
      await map[id].adapter.selectRanges(checkId, map[id].matches);
    }
  }

  async replaceRanges(checkId: string, matchesWithReplacement: MatchWithReplacement[]): Promise<void> {
    const map = this.remapMatches(matchesWithReplacement);
    for (const id in map) {
      await map[id].adapter.replaceRanges(checkId, map[id].matches);
    }
  }
}
