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

import * as _ from "lodash";
import {Match} from "../acrolinx-libs/plugin-interfaces";


export interface OffSetAlign {
  oldPosition: number;
  diffOffset: number;
}

export interface AlignedMatch<T extends Match> {
  originalMatch: T;
  range: [number, number];
}

export function findDisplacement(offsetMappingArray: OffSetAlign[], originalIndex: number) {
  if (offsetMappingArray.length === 0) {
    return 0;
  }
  const index = _.sortedIndexBy(offsetMappingArray,
    {diffOffset: 0, oldPosition: originalIndex + 0.1},
    offsetAlign => offsetAlign.oldPosition
  );
  return index > 0 ? offsetMappingArray[index - 1].diffOffset : 0;
}

export function findNewIndex(offsetMappingArray: OffSetAlign[], originalIndex: number) {
  return originalIndex + findDisplacement(offsetMappingArray, originalIndex);
}
