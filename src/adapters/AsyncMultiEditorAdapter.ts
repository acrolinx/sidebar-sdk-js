/* Copyright (c) 2018 Acrolinx GmbH */

import 'es6-promise/auto';
import {Match, MatchWithReplacement} from "../acrolinx-libs/plugin-interfaces";
import {AdapterInterface, AsyncAdapterInterface} from "./AdapterInterface";
import {AddSingleAdapterOptions, MultiEditorAdapter} from "./MultiEditorAdapter";

export class AsyncMultiEditorAdapter extends MultiEditorAdapter implements AsyncAdapterInterface {
  readonly isAsync = true;
  readonly requiresSynchronization = true;

  addSingleAdapter(singleAdapter: AsyncAdapterInterface | AdapterInterface, opts: AddSingleAdapterOptions = {}, id?: string) {
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

