import {_} from "../acrolinx-libs/acrolinx-libs-defaults";

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

export function isIFrame(el: HTMLElement): el is HTMLIFrameElement {
  return el.nodeName === 'IFRAME';
}

export function fakeInputEvent(el: Element) {
  el.dispatchEvent(new CustomEvent('input'));
}

export function parseUrl(href: string) {
  const aElement: HTMLAnchorElement = document.createElement('a');
  aElement.href = href;
  if (aElement.host === '') {
    // IE workaround.
    aElement.href = aElement.href;
  }
  const {protocol, host, hostname, port, pathname, hash} = aElement;
  return {protocol, host, hostname, port, pathname, hash};
}

export function isFromSameOrigin(url: string) {
  const {protocol, host} = parseUrl(url);
  return location.protocol === protocol && location.host === host;
}

export function toSet(keys: string[]) {
  return Object.freeze(_.zipObject(keys, keys.map(_.constant(true)))) as {[key: string]: boolean};
}

export function assign<T, U>(obj: T, update: U) : T&U {
  return _.assign({}, obj, update) as T&U;
}

function deepFreeze(o: any) {
  Object.freeze(o);

  const oIsFunction = typeof o === "function";
  const hasOwnProp = Object.prototype.hasOwnProperty;

  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (hasOwnProp.call(o, prop)
      && (oIsFunction ? prop !== 'caller' && prop !== 'callee' && prop !== 'arguments' : true )
      && o[prop] !== null
      && (typeof o[prop] === "object" || typeof o[prop] === "function")
      && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });
}

export function deepFreezed<T>(o: T): T {
  const oClone = _.cloneDeep(o);
  deepFreeze(oClone);
  return oClone;
}

export function isDisplayed(element: Element) : boolean {
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

export function loadObjectFromLocalStorage<T>(key: string, defaultValue: T): T {
  const valueString = localStorage.getItem(key);
  if (valueString) {
    return assign(defaultValue, JSON.parse(valueString));
  } else {
    return defaultValue;
  }
}

export function saveObjectToLocalStorage<T>(key: string, object: T) {
  localStorage.setItem(key, JSON.stringify(object));
}

export function removeElement(el: Element) {
  el.parentNode.removeChild(el);
}