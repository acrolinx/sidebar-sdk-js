/*
 * Copyright 2016-present Acrolinx GmbH
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

'use strict';

import {AlignedMatch} from "./alignment";
import {Match} from "../acrolinx-libs/plugin-interfaces";

export function getCompleteFlagLength<T extends Match>(matches: AlignedMatch<T>[]) {
  return matches[matches.length - 1].range[1] - matches[0].range[0];
}

export function rangeContent(content: string, m: { range: [number, number] }) {
  return content.slice(m.range[0], m.range[1]);
}

/**
 * We don't want to destroy markup/markdown.
 */
export function isDangerousToReplace(checkedDocumentContent: string, originalMatch: Match) {
  return /^ *$/.test(originalMatch.content)
    && (originalMatch.content != rangeContent(checkedDocumentContent, originalMatch));
}
