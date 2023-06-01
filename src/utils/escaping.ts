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

import { OffSetAlign } from './alignment';

export interface EscapeHtmlCharactersResult {
  escapedText: string;
  backwardAlignment: OffSetAlign[];
}

const HTML_ESCAPES: { [key: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

export function escapeHtmlCharacters(text: string): EscapeHtmlCharactersResult {
  let escapedText = '';
  const backwardAlignment: OffSetAlign[] = [];
  let currentDiffOffset = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const escapedChar = HTML_ESCAPES[char];
    if (escapedChar) {
      const additionalChars = escapedChar.length - 1;
      currentDiffOffset = currentDiffOffset - additionalChars;
      backwardAlignment.push({
        oldPosition: escapedText.length + escapedChar.length,
        diffOffset: currentDiffOffset,
      });
    }
    escapedText = escapedText + (escapedChar || char);
  }
  return { escapedText, backwardAlignment };
}
