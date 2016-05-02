namespace acrolinx.plugins.utils {
  'use strict';

  export const SIDEBAR_URL = 'https://acrolinx-sidebar-classic.s3.amazonaws.com/v14/prod/';

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

  /**
   * Loads the Styles and Scripts of the sidebar into the current window.
   * @param sidebarUrl must end with /
   */
  export function loadSidebarCode(sidebarUrl = SIDEBAR_URL) {
    const sidebarBaseUrl = sidebarUrl;

    const getAbsoluteAttributeValue = (s: string) => s.replace(/^.*"(.*)".*$/g, sidebarBaseUrl + '$1');

    utils.fetch(sidebarBaseUrl + 'index.html', sidebarHtml => {
      const withoutComments = sidebarHtml.replace(/<!--[\s\S]*?-->/g, '');
      const head = document.querySelector('head');

      const css = withoutComments
        .match(/href=".*?"/g)
        .map(getAbsoluteAttributeValue);
      css.forEach(ref => {
        head.appendChild(createCSSLinkElement(ref));
      });

      const scripts = withoutComments
        .match(/src=".*?"/g)
        .map(getAbsoluteAttributeValue);
      scripts.forEach(ref => {
        head.appendChild(createScriptElement(ref));
      });

   });
  }

  export function loadSidebarIntoIFrame(config: AcrolinxPluginConfig, sidebarIFrameElement: HTMLIFrameElement, onSidebarLoaded: () => void) {
    const sidebarBaseUrl = config.sidebarUrl || SIDEBAR_URL;
    const completeSidebarUrl = sidebarBaseUrl + 'index.html';
    if (config.useMessageAdapter) {
      sidebarIFrameElement.addEventListener('load', onSidebarLoaded);
      sidebarIFrameElement.src = completeSidebarUrl;
    } else {
      utils.fetch(completeSidebarUrl, sidebarHtml => {
        const sidebarContentWindow = sidebarIFrameElement.contentWindow;
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


}