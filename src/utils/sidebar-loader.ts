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

import { ACROLINX_STARTPAGE_INLINED_HTML } from '@acrolinx/sidebar-startpage';
import { internalFetch, isFromSameOrigin } from './utils';
import { AcrolinxPluginConfig } from '../acrolinx-plugin-config';

export class SidebarURLInvalidError extends Error {
  public details: string;

  constructor(
    public message: string,
    public configuredSidebarURL: string,
    public htmlLoaded: string,
  ) {
    super(message);
    this.configuredSidebarURL = configuredSidebarURL;
    this.htmlLoaded = htmlLoaded;
    this.details = message + '\n' + 'Configured SidebarURL:' + configuredSidebarURL + '\n' + htmlLoaded;
  }
}

function createCSSLinkElement(href: string) {
  const el = document.createElement('link');
  el.rel = 'stylesheet';
  el.href = href;
  return el;
}

function createScriptElement(src: string) {
  const el = document.createElement('script');
  el.src = src;
  el.type = 'text/javascript';
  el.async = false;
  el.defer = false;
  return el;
}

function createCompleteSidebarUrl(sidebarBaseUrl: string) {
  const timestamp = Date.now();
  return sidebarBaseUrl + 'index.html?t=' + timestamp;
}

/**
 * Loads the Styles and Scripts of the sidebar into the current window.
 * @param sidebarUrl must end with /
 *
 * TODO: Is this function currently used in any of our clients?
 */
export async function loadSidebarCode(sidebarBaseUrl: string) {
  const completeSidebarUrl = createCompleteSidebarUrl(sidebarBaseUrl);
  const sidebarHtml = await internalFetch(completeSidebarUrl);
  if (sidebarHtml.indexOf('<meta name="sidebar-version"') < 0) {
    try {
      throw new SidebarURLInvalidError(
        'It looks like the sidebar URL was configured wrongly.',
        sidebarBaseUrl,
        sidebarHtml,
      );
    } catch (error) {
      console.log(error);
      return;
    }
  }

  const withoutComments = sidebarHtml.replace(/<!--[\s\S]*?-->/g, '');
  const head = document.querySelector('head')!;

  const makeRelativeUrlsAbsolutToSidebar = (url: string) => rebaseRelativeUrl(url, sidebarBaseUrl);

  const css = grepAttributeValues(withoutComments, 'href').map(makeRelativeUrlsAbsolutToSidebar);
  css.forEach((ref) => {
    head.appendChild(createCSSLinkElement(ref));
  });

  const scripts = grepAttributeValues(withoutComments, 'src').map(makeRelativeUrlsAbsolutToSidebar);
  scripts.forEach((ref) => {
    head.appendChild(createScriptElement(ref));
  });
}

// Exported only for testing
export function grepAttributeValues(html: string, attribute: string): string[] {
  const regexp = new RegExp(`${attribute}="(.*?)"`, 'g');
  let matches;
  const result = [];
  while ((matches = regexp.exec(html)) !== null) {
    result.push(matches[1]);
  }
  return result;
}

// Exported only for testing
export function rebaseRelativeUrl(url: string, sidebarBaseUrl: string): string {
  if (url.match(/^https?:/)) {
    return url;
  } else {
    return sidebarBaseUrl + url;
  }
}

export async function loadSidebarIntoIFrame(
  config: AcrolinxPluginConfig,
  sidebarIFrameElement: HTMLIFrameElement,
  onSidebarLoaded: () => void,
) {
  if (config.sidebarHtml || !config.sidebarUrl) {
    injectSidebarHtml(config.sidebarHtml || ACROLINX_STARTPAGE_INLINED_HTML, sidebarIFrameElement);
    onSidebarLoaded();
    return;
  }
  const sidebarBaseUrl = config.sidebarUrl;
  const completeSidebarUrl = createCompleteSidebarUrl(sidebarBaseUrl);
  if (config.useMessageAdapter || (config.useSidebarFromSameOriginDirectly && isFromSameOrigin(sidebarBaseUrl))) {
    sidebarIFrameElement.addEventListener('load', onSidebarLoaded);
    sidebarIFrameElement.src = completeSidebarUrl;
  } else {
    const sidebarHtml = await internalFetch(completeSidebarUrl);
    if (sidebarHtml.indexOf('<meta name="sidebar-version"') < 0) {
      try {
        throw new SidebarURLInvalidError(
          'It looks like the sidebar URL was configured wrongly. ' + 'Check developer console for more information!',
          completeSidebarUrl,
          sidebarHtml,
        );
      } catch (error) {
        if (error instanceof Error) {
          injectSidebarHtml(error.message, sidebarIFrameElement);
        } else {
          injectSidebarHtml('Unknown error loading sidebar', sidebarIFrameElement);
        }
        console.error(error);
        return;
      }
    }

    const sidebarHtmlWithAbsoluteLinks = rebaseRelativeUrls(sidebarHtml, sidebarBaseUrl);
    injectSidebarHtml(sidebarHtmlWithAbsoluteLinks, sidebarIFrameElement);
    onSidebarLoaded();
  }
}

// Exported only for testing
export function rebaseRelativeUrls(sidebarHtml: string, sidebarBaseUrl: string): string {
  return sidebarHtml
    .replace(/src="(?!https?:)/g, 'src="' + sidebarBaseUrl)
    .replace(/href="(?!https?:)/g, 'href="' + sidebarBaseUrl);
}

function injectSidebarHtml(sidebarHtml: string, sidebarIFrameElement: HTMLIFrameElement) {
  const sidebarContentWindow = sidebarIFrameElement.contentWindow!;
  sidebarContentWindow.document.open();
  sidebarContentWindow.document.write(sidebarHtml);
  sidebarContentWindow.document.close();
}
