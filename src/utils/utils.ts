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

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function logTime(text: string, f: Function) {
  const startTime = Date.now();
  const result = f();
  console.log(`Duration of "${text}:"`, Date.now() - startTime);
  return result;
}

export async function internalFetch(url: string): Promise<string> {
  const response = await fetch(url);
  if (response.status >= 200 && response.status < 400) {
    return response.text();
  }
  throw new Error(`Error while loading ${url}.`);
}

export function isIFrame(el: Element): el is HTMLIFrameElement {
  return el.nodeName === 'IFRAME';
}

export type SimulateInputEventProps = {
  startNode: Node;
  endNode: Node;
  eventType: string;
  startOffset: number;
  endOffset: number;
  replacement: string;
  disableSimulation?: boolean;
};

export function simulateInputEvent(props: SimulateInputEventProps) {
  const {
    startNode: startNode,
    endNode: endNode,
    eventType,
    startOffset,
    endOffset,
    replacement,
    disableSimulation,
  } = props;
  if (disableSimulation) {
    return;
  }
  const staticRange: StaticRange = new StaticRange({
    startContainer: startNode,
    startOffset,
    endContainer: endNode,
    endOffset,
  });

  const eventOptions: InputEventInit = {
    inputType: 'insertText',
    data: replacement,
    bubbles: true,
    cancelable: false,
    targetRanges: [staticRange],
  };

  startNode.dispatchEvent(new InputEvent(eventType, eventOptions));
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
  return Object.freeze(Object.fromEntries(keys.map((key) => [key, true])) as { [key: string]: boolean });
}

export function assign<T, U>(obj: T, update: U): T & U {
  return Object.assign({}, obj, update) as T & U;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const oClone = structuredClone(o);
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

export function deepCloneWithHTMLElement<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (obj instanceof HTMLElement) {
    return obj.cloneNode(true) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepCloneWithHTMLElement) as T;
  }

  try {
    return structuredClone(obj) as T;
  } catch (e: unknown) {
    console.log('Object cannot be structured clone.', e);
    const clonedObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepCloneWithHTMLElement((obj as Record<string, unknown>)[key]);
      }
    }
    return clonedObj as T;
  }
}
