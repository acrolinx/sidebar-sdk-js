import {Q} from "../acrolinx-libs/acrolinx-libs-defaults";
import {loadObjectFromLocalStorage, saveObjectToLocalStorage} from "../utils/utils";

export interface AsyncStorage {
  get<T>(key: string): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
}

export class AsyncLocalStorage implements AsyncStorage {
  get<T>(key: string): Promise<T> {
    return Q(loadObjectFromLocalStorage(key, undefined));
  }

  set<T>(key: string, value: T) {
    saveObjectToLocalStorage(key, value);
    return Q(undefined);
  }
}