/*
 * Copyright 2018-present Acrolinx GmbH
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

import {Deferred} from "./utils";

class Fifo<T> {
  private store: T[] = [];

  push(val: T) {
    this.store.push(val);
  }

  pop(): T | undefined {
    return this.store.shift();
  }
}

export type PromiseProvider<T> = () => PromiseLike<T>;

interface WorkItem<T> {
  work: PromiseProvider<T>;
  deferred: Deferred<T>;
}

export class WorkQueue {
  private workTodo = new Fifo<WorkItem<any>>();
  private currentWork?: PromiseLike<any>;

  addWork<T>(work: PromiseProvider<T>): Promise<T> {
    const workItem: WorkItem<T> = {
      work: work,
      deferred: new Deferred()
    };
    this.workTodo.push(workItem);
    if (!this.currentWork) {
      this.doRemainingWork();
    }
    return workItem.deferred.promise;
  }

  private doRemainingWork() {
    const nextWorkItem = this.workTodo.pop();
    if (nextWorkItem) {
      this.currentWork = nextWorkItem.work();
      this.currentWork.then((result) => {
        nextWorkItem.deferred.resolve(result);
        this.currentWork = undefined;
        this.doRemainingWork();
      }, (error) => {
        nextWorkItem.deferred.reject(error);
        this.currentWork = undefined;
        this.doRemainingWork();
      });
    }
  }

}

