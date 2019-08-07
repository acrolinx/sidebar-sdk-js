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
import {toSet} from "./utils";
import {OffSetAlign} from "./alignment";
import * as entities from 'entities';

const REPLACE_SCRIPTS_REGEXP = '<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\/script>';
const REPLACE_STYLES_REGEXP = '<style\\b[^<]*(?:(?!<\\/style>)<[^<]*)*<\/style>';
const REPLACE_TAG_REGEXP = '<([^>]+)>';
const REPLACE_ENTITY_REGEXP = '&.*?;';
// Order is important.
const REPLACE_TAGS_PARTS = [REPLACE_SCRIPTS_REGEXP, REPLACE_STYLES_REGEXP, REPLACE_TAG_REGEXP, REPLACE_ENTITY_REGEXP];
const REPLACE_TAGS_REGEXP = '(' + REPLACE_TAGS_PARTS.join('|') + ')';

export const NEW_LINE_TAGS = toSet(['BR', 'P', 'DIV']);
export const AUTO_SELF_CLOSING_LINE_TAGS = toSet(['BR']);


function getTagReplacement(completeTag: string): string {
  const [slash1 = '', tagName = '', slash2 = ''] = ((/^<(\/?)(\w+)/i).exec(completeTag.toUpperCase()) || []).slice(1);
  if (tagName) {
    if (AUTO_SELF_CLOSING_LINE_TAGS[tagName] ||
      (NEW_LINE_TAGS[tagName] && (slash1 || slash2))) {
      return '\n';
    }
  }
  return '';
}

// Exported for testing
export function extractText(s: string): [string, OffSetAlign[]] {
  const regExp = new RegExp(REPLACE_TAGS_REGEXP, 'ig');
  const offsetMapping: OffSetAlign[] = [];
  let currentDiffOffset = 0;
  const resultText = s.replace(regExp, (tagOrEntity, _p1, _p2, offset) => {
    const rep = _.startsWith(tagOrEntity, '&') ? entities.decodeHTMLStrict(tagOrEntity) : getTagReplacement(tagOrEntity);
    currentDiffOffset -= tagOrEntity.length - rep.length;
    offsetMapping.push({
      oldPosition: offset + tagOrEntity.length,
      diffOffset: currentDiffOffset
    });
    return rep;
  });
  return [resultText, offsetMapping];
}
