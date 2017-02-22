import * as _ from "lodash";
import * as utils from "./utils";
import {AcrolinxPluginConfig} from "../acrolinx-plugin";

export const SIDEBAR_URL = 'https://sidebar-classic.acrolinx-cloud.com/v14/prod/';

export class SidebarURLInvalidError extends Error {
  public details: string;
  constructor(public message: string, public configuredSidebarURL: string, public htmlLoaded: string) {
    super(message);
    this.configuredSidebarURL = configuredSidebarURL;
    this.htmlLoaded = htmlLoaded;
    this.details = message + "\n" +
      "Configured SidebarURL:" + configuredSidebarURL + "\n" +
      htmlLoaded;
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
 */
export function loadSidebarCode(sidebarUrl = SIDEBAR_URL) {
  const sidebarBaseUrl = sidebarUrl;

  const getAbsoluteAttributeValue = (s: string) => s.replace(/^.*"(.*)".*$/g, sidebarBaseUrl + '$1');
  
  const completeSidebarUrl = createCompleteSidebarUrl(sidebarBaseUrl);
  utils.fetch(completeSidebarUrl, sidebarHtml => {
    if (sidebarHtml.indexOf("<meta name=\"sidebar-version\"") < 0) {
      try {
        throw new SidebarURLInvalidError("It looks like the sidebar URL was configured wrongly.", sidebarBaseUrl, sidebarHtml);
      } catch (error) {
        console.log(error.details);
        return;
      }
    }

    const withoutComments = sidebarHtml.replace(/<!--[\s\S]*?-->/g, '');
    const head = document.querySelector('head')!;

    const css = _.map(withoutComments.match(/href=".*?"/g) || [], getAbsoluteAttributeValue);
    css.forEach(ref => {
      head.appendChild(createCSSLinkElement(ref));
    });

    const scripts = _.map(withoutComments.match(/src=".*?"/g) || [], getAbsoluteAttributeValue);
    scripts.forEach(ref => {
      head.appendChild(createScriptElement(ref));
    });

  });
}

export function loadSidebarIntoIFrame(config: AcrolinxPluginConfig, sidebarIFrameElement: HTMLIFrameElement, onSidebarLoaded: () => void) {
  const sidebarBaseUrl = config.sidebarUrl || SIDEBAR_URL;
  const completeSidebarUrl = createCompleteSidebarUrl(sidebarBaseUrl);
  if (config.useMessageAdapter || (config.useSidebarFromSameOriginDirectly && utils.isFromSameOrigin(sidebarBaseUrl))) {
    sidebarIFrameElement.addEventListener('load', onSidebarLoaded);
    sidebarIFrameElement.src = completeSidebarUrl;
  } else {
    utils.fetch(completeSidebarUrl, sidebarHtml => {
      const sidebarContentWindow = sidebarIFrameElement.contentWindow;
      if (sidebarHtml.indexOf("<meta name=\"sidebar-version\"") < 0) {
        try {
          throw new SidebarURLInvalidError("It looks like the sidebar URL was configured wrongly. " +
            "Check developer console for more information!", completeSidebarUrl, sidebarHtml);
        } catch (error) {
          sidebarContentWindow.document.open();
          sidebarContentWindow.document.write(error.message);
          sidebarContentWindow.document.close();
          console.error(error.details);
          return;
        }
      }
      const sidebarHtmlWithAbsoluteLinks = sidebarHtml
        .replace(/src="/g, 'src="' + sidebarBaseUrl)
        .replace(/href="/g, 'href="' + sidebarBaseUrl);
      sidebarContentWindow.document.open();
      sidebarContentWindow.document.write(sidebarHtmlWithAbsoluteLinks);
      sidebarContentWindow.document.close();
      onSidebarLoaded();
    });
  }
}

