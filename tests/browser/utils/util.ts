/*
 * Copyright 2015-present Acrolinx GmbH
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

import { expect } from 'vitest';
import { AdapterInterface, SuccessfulContentExtractionResult } from '../../../src/adapters/adapter-interface';
import { AdapterTestSetup } from '../adapter-setups/adapter-setup';

export function htmlStringToElements(htmlString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  return doc.body.firstElementChild as Element;
}

export const assertEditorRawContent = (adapter: AdapterInterface, expectedContent: string) => {
  const editorContent = (adapter.extractContentForCheck({}) as SuccessfulContentExtractionResult).content;
  expect(editorContent).toEqual(expectedContent);
};

export const assertEditorText = (adapterSpec: AdapterTestSetup, adapter: AdapterInterface, expectedText: string) => {
  console.log(expectedText);
  const editorContent = (adapter.extractContentForCheck({}) as SuccessfulContentExtractionResult).content;
  if (adapterSpec.inputFormat === 'TEXT') {
    expect(editorContent).toEqual(expectedText);
  } else {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorContent;
    const actualText = tempDiv.textContent!.replace('\n', '');
    expect(actualText).toEqual(expectedText);
  }
};

export const registerCheckResult = (adapter: AdapterInterface, text: string, dummyCheckId: string) => {
  adapter.registerCheckResult({
    checkedPart: {
      checkId: dummyCheckId,
      range: [0, text.length],
    },
  });
};

export const givenAText = (
  adapter: AdapterInterface,
  adapterSpec: AdapterTestSetup,
  dummyCheckId: string,
  text: string,
  callback: (initialExtractedContent: string) => void,
) => {
  adapterSpec.setEditorContent(text);

  console.log('callback called');
  adapter.registerCheckCall({ checkId: dummyCheckId });
  const contentExtractionResult = adapter.extractContentForCheck({}) as SuccessfulContentExtractionResult;
  registerCheckResult(adapter, text, dummyCheckId);
  callback(contentExtractionResult.content);
};

export const givenATextWithoutCheckResult = (
  adapter: AdapterInterface,
  adapterSpec: AdapterTestSetup,
  text: string,
  dummyCheckId: string,
  callback: (initialExtractedContent: string) => void,
) => {
  adapterSpec.setEditorContent(text);
  adapter.registerCheckCall({ checkId: dummyCheckId });
  const contentExtractionResult = adapter.extractContentForCheck({}) as SuccessfulContentExtractionResult;
  callback(contentExtractionResult.content);
};

export const normalizeResultHtml = (html: string) => {
  return html.replace(/\n|<span><\/span>/g, '');
};
