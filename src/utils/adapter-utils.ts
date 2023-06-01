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

import * as _ from 'lodash';
import { AutobindWrapperAttributes } from '../adapters/AdapterInterface';
import { isDisplayed } from '../utils/utils';

export function getAutobindWrapperAttributes(element: Element): AutobindWrapperAttributes {
  const attributes: AutobindWrapperAttributes = {
    'original-id': element.id,
    'original-class': element.className,
    'original-name': (element as HTMLInputElement).name,
    'original-source': element.tagName.toLowerCase(),
    'original-display': isDisplayed(element) ? '' : 'hidden',
  };

  for (const attributeName of element.getAttributeNames().filter((it) => _.startsWith(it, 'aria-'))) {
    attributes['original-' + attributeName] = element.getAttribute(attributeName)!;
  }

  return _.omitBy(attributes, _.isEmpty) as AutobindWrapperAttributes;
}
