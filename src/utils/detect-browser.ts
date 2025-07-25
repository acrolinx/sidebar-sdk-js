/* eslint-disable no-useless-escape */
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

const UNKNOWN_BROWSER = { name: 'unknown', version: '0' };

const BROWSER_AND_USER_AGENT_PATTERNS: [string, RegExp][] = [
  ['edge', /Edge\/([0-9\._]+)/],
  ['yandexbrowser', /YaBrowser\/([0-9\._]+)/],
  ['vivaldi', /Vivaldi\/([0-9\.]+)/],
  ['kakaotalk', /KAKAOTALK\s([0-9\.]+)/],
  ['chrome', /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/],
  ['phantomjs', /PhantomJS\/([0-9\.]+)(:?\s|$)/],
  ['crios', /CriOS\/([0-9\.]+)(:?\s|$)/],
  ['firefox', /Firefox\/([0-9\.]+)(?:\s|$)/],
  ['fxios', /FxiOS\/([0-9\.]+)/],
  ['opera', /Opera\/([0-9\.]+)(?:\s|$)/],
  ['opera', /OPR\/([0-9\.]+)(:?\s|$)$/],
  ['ie', /Trident\/7\.0.*rv\:([0-9\.]+).*\).*Gecko$/],
  ['ie', /MSIE\s([0-9\.]+);.*Trident\/[4-7].0/],
  ['ie', /MSIE\s(7\.0)/],
  ['bb10', /BB10;\sTouch.*Version\/([0-9\.]+)/],
  ['android', /Android\s([0-9\.]+)/],
  ['ios', /Version\/([0-9\._]+).*Mobile.*Safari.*/],
  ['safari', /Version\/([0-9\._]+).*Safari/],
];

export interface DetectedBrowser {
  name: string;
  version: string;
}

function detectBrowser(): DetectedBrowser {
  try {
    return parseUserAgent(navigator.userAgent) || UNKNOWN_BROWSER;
  } catch (error) {
    console.error('Error in detectBrowser:', error);
    return UNKNOWN_BROWSER;
  }
}

function parseUserAgent(userAgentString: string): DetectedBrowser | undefined {
  if (!userAgentString) {
    return undefined;
  }

  return (
    BROWSER_AND_USER_AGENT_PATTERNS.map(([browserName, regexp]) => {
      const match = regexp.exec(userAgentString);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let version = match && (match[1].split(/[._]/).slice(0, 3) as any);

      if (version && version.length < 3) {
        version = version.concat(version.length == 1 ? [0, 0] : [0]);
      }

      return (
        match && {
          name: browserName,
          version: version.join('.'),
        }
      );
    }).filter(Boolean)[0] || undefined
  );
}

export const browser = detectBrowser();

export function isChrome() {
  return browser.name === 'chrome';
}
