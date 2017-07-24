import {Promise} from 'es6-promise';

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