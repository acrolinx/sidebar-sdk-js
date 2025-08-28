/*
 * Copyright 2018-present Acrolinx GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Match, MatchWithReplacement } from '@acrolinx/sidebar-interface';
import { AdapterInterface, AsyncAdapterInterface } from './AdapterInterface';
import { AddSingleAdapterOptions, MultiEditorAdapter } from './MultiEditorAdapter';

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
