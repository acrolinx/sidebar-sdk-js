'use strict';

import {AlignedMatch} from "./alignment";
import {Match} from "../acrolinx-libs/plugin-interfaces";

export function getCompleteFlagLength<T extends Match>(matches: AlignedMatch<T>[]) {
  return matches[matches.length - 1].range[1] - matches[0].range[0];
}
