import {Q} from "../acrolinx-libs/acrolinx-libs-defaults";

export interface AsyncStorage {
  get<T>(key: string): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
}

export class AsyncLocalStorage implements AsyncStorage {
  get<T>(key: string): Promise<T | null> {
    return Q.Promise((resolve: Function) => {
      resolve(loadFromLocalStorage(key));
    });
  }

  set<T>(key: string, value: T) {
    return Q.Promise((resolve: Function) => {
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