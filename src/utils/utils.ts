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

export function logTime(text: string, f: Function) {
  const startTime = Date.now();
  const result = f();
  console.log(`Duration of "${text}:"`, Date.now() - startTime);
  return result;
}

export function fetch(url: string, callback: (s: string) => void) {
  const request = new XMLHttpRequest();
  request.open('GET', url, true);

  request.onload = function () {
    if (request.status >= 200 && request.status < 400) {
      callback(request.responseText);
    } else {
      throw new Error(`Error while loading ${url}.`);
    }
  };

  request.onerror = function () {
    throw new Error(`Error while loading ${url}.`);
  };

  request.send();
}

export function isIFrame(el: Element): el is HTMLIFrameElement {
  return el.nodeName === 'IFRAME';
}

export type SimulateInputEventProps = {
  node: Node;
  eventType: string;
  startOffset: number;
  endOffset: number;
  replacement: string;
  disableSimulation?: boolean;
};

export function simulateInputEvent(props: SimulateInputEventProps) {
  const { node, eventType, startOffset, endOffset, replacement, disableSimulation } = props;
  if (disableSimulation) {
    return;
  }
  const staticRange: StaticRange = new StaticRange({
    startContainer: node,
    startOffset,
    endContainer: node,
    endOffset,
  });

  const eventOptions: InputEventInit = {
    inputType: 'insertText',
    data: replacement,
    bubbles: true,
    cancelable: false,
    targetRanges: [staticRange],
  };

  node.dispatchEvent(new InputEvent(eventType, eventOptions));
}

export function parseUrl(href: string) {
  const aElement: HTMLAnchorElement = document.createElement('a');
  aElement.href = href;
  if (aElement.host === '') {
    // IE workaround.
    // eslint-disable-next-line no-self-assign
    aElement.href = aElement.href;
  }
  const { protocol, host, hostname, port, pathname, hash } = aElement;
  return { protocol, host, hostname, port, pathname, hash };
}

export function isFromSameOrigin(url: string) {
  const { protocol, host } = parseUrl(url);
  return location.protocol === protocol && location.host === host;
}

export function toSet(keys: string[]) {
  return Object.freeze(_.zipObject(keys, keys.map(_.constant(true))) as { [key: string]: boolean });
}

export function assign<T, U>(obj: T, update: U): T & U {
  return _.assign({}, obj, update) as T & U;
}

function deepFreeze(o: any) {
  Object.freeze(o);

  const oIsFunction = typeof o === 'function';
  const hasOwnProp = Object.prototype.hasOwnProperty;

  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (
      hasOwnProp.call(o, prop) &&
      (oIsFunction ? prop !== 'caller' && prop !== 'callee' && prop !== 'arguments' : true) &&
      o[prop] !== null &&
      (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
      !Object.isFrozen(o[prop])
    ) {
      deepFreeze(o[prop]);
    }
  });
}

export function deepFreezed<T>(o: T): T {
  const oClone = _.cloneDeep(o);
  deepFreeze(oClone);
  return oClone;
}

export function isDisplayed(element: Element): boolean {
  if (!element.parentNode) {
    return false;
  }
  const boundingBox = element.getBoundingClientRect();
  return !!boundingBox.width && !!boundingBox.height;
}

export function assertElementIsDisplayed(element: Element) {
  if (!isDisplayed(element)) {
    throw Error('Adapter element is not displayed.');
  }
}

export function containsText(s: string) {
  return /\S/.test(s);
}

export function removeNode(node: Node) {
  node.parentNode!.removeChild(node);
}

export function isPromise<T>(result: T | Promise<T>): result is Promise<T> {
  return result && typeof (<Promise<T>>result).then === 'function';
}

export class Deferred<T> {
  resolve!: (x: T) => void;
  reject!: (x: T) => void;
  promise: Promise<T>;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

export function waitMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
