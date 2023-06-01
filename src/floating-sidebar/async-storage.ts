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

import 'es6-promise/auto';

export interface AsyncStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
}

export class AsyncLocalStorage implements AsyncStorage {
  get<T>(key: string): Promise<T | null> {
    return new Promise<T | null>((resolve) => {
      resolve(loadFromLocalStorage<T>(key));
    });
  }

  set<T>(key: string, value: T) {
    return new Promise<undefined>((resolve: Function) => {
      saveToLocalStorage(key, value);
      resolve(undefined);
    });
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  const valueString = localStorage.getItem(key);
  if (valueString === null) {
    return null;
  }
  return JSON.parse(valueString);
}

export function saveToLocalStorage<T>(key: string, object: T) {
  localStorage.setItem(key, JSON.stringify(object));
}
