namespace acrolinx.plugins.utils {
  'use strict';

  import AlignedMatch = acrolinx.plugins.lookup.AlignedMatch;
  import Match = acrolinx.sidebar.Match;

  import _ = acrolinxLibs._;

  export function logTime(text: string, f: Function) {
    const startTime = Date.now();
    const result = f();
    console.log(`Duration of "${text}:"`, Date.now() - startTime);
    return result;
  }

  export function getCompleteFlagLength<T extends Match>(matches: AlignedMatch<T>[]) {
    return matches[matches.length - 1].range[1] - matches[0].range[0];
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

  export function toSet(keys: string[])  {
    return Object.freeze(_.zipObject(keys, keys.map(_.constant(true)))) as {[key: string]: boolean};
  }

}