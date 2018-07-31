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

