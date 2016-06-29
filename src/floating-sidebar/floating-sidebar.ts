namespace acrolinx.plugins.floatingSidebar {
  'use strict';

  import _ = acrolinxLibs._;

  export const SIDEBAR_ID = 'acrolinxFloatingSidebar';
  export const TITLE_BAR_CLASS = 'acrolinxFloatingSidebarTitleBar';
  export const CLOSE_ICON_CLASS = 'acrolinxFloatingSidebarCloseIcon';
  export const SIDEBAR_CONTAINER_ID = 'acrolinxSidebarContainer';
  export const SIDEBAR_DRAG_OVERLAY_ID = 'acrolinxDragOverlay';
  export const SIDEBAR_GLASS_PANE_ID = 'acrolinxFloatingSidebarGlassPane';

  const initialPos = {
    top: 20,
    left: 20
  };

  function addStyles() {
    const height = Math.max(300, Math.min(900, window.innerHeight - initialPos.top - 40));
    const styleTag = document.createElement('style');
    const head = document.querySelector('head');
    styleTag.innerHTML = `
      #${SIDEBAR_ID} {
        top: ${initialPos.top}px;
        left: ${initialPos.left}px;
        position: fixed;
        width: 300px;
        padding-top: 0px;
        cursor: move;
        background: #3e96db;
        height: ${height}px;
        box-shadow: 5px 5px 30px rgba(0, 0, 0, 0.3);
        border-radius: 3px;
        user-select: none;
        z-index: 10000;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
      }
      
      #${SIDEBAR_ID} .${TITLE_BAR_CLASS} {
        font-family: Roboto, sans-serif;
        line-height: 13px;
        padding: 5px;
        font-size: 13px;
        font-weight: normal;
        color: white;
      }
      
      #${SIDEBAR_ID} .${CLOSE_ICON_CLASS} {
        float: right;
        cursor: pointer;
        margin-right: 4px;
        opacity: 0.7;
        transition: opacity 0.5s;
      }
      
      #${SIDEBAR_ID} .${CLOSE_ICON_CLASS}:hover {
        opacity: 1;
      }
      
      #${SIDEBAR_ID} #${SIDEBAR_CONTAINER_ID},
      #${SIDEBAR_ID} #acrolinxDragOverlay,
      #${SIDEBAR_ID} #${SIDEBAR_CONTAINER_ID} iframe {
        position: relative;
        background: white;
        height: 100%;
        border: none;
      }
      
      #${SIDEBAR_ID} #${SIDEBAR_DRAG_OVERLAY_ID} {
        position: absolute;
        top: 20px;
        left: 0;
        height: 300px;
        width: 300px;
        background: transparent;
        z-index: 10001;
      }
       
      #${SIDEBAR_GLASS_PANE_ID} {
        position: fixed;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        top: 0;
        left: 0;
        background: white;
        opacity: 0.6;
        z-index: 9999;
      }
    `;
    head.appendChild(styleTag);
  }

  const TEMPLATE = `
    <div id="${SIDEBAR_ID}">
      <div class="${TITLE_BAR_CLASS}">Acrolinx <span class="${CLOSE_ICON_CLASS}">&#x274c</span></div>
      <div id="${SIDEBAR_CONTAINER_ID}"></div>
      <div id="${SIDEBAR_DRAG_OVERLAY_ID}"></div>
    </div>
  `;

  function createDiv(attributes: {[attribute: string]: string} = {}): HTMLElement {
    const el = document.createElement('div');
    _.assign(el, attributes);
    return el;
  }

  function hide(el: HTMLElement) {
    el.style.display = 'none';
  }

  function show(el: HTMLElement) {
    el.style.display = 'block';
  }

  function createNodeFromTemplate(template: string): HTMLElement {
    return createDiv({innerHTML: template.trim()}).firstChild as HTMLElement;
  }

  export interface FloatingSidebar {
    hide(): void;
    show(): void;
  }

  export function initFloatingSidebar(): FloatingSidebar {
    const floatingSidebarElement = createNodeFromTemplate(TEMPLATE);
    const dragOverlay = floatingSidebarElement.querySelector('#' + SIDEBAR_DRAG_OVERLAY_ID) as HTMLElement;
    const closeIcon = floatingSidebarElement.querySelector('.' + CLOSE_ICON_CLASS) as HTMLElement;
    const glassPane = createDiv({id: SIDEBAR_GLASS_PANE_ID});
    const body = document.querySelector('body');
    let isDragging = false;
    let relativeMouseDownX = 0;
    let relativeMouseDownY = 0;

    function move(xpos: number, ypos: number) {
      floatingSidebarElement.style.left = xpos + 'px';
      floatingSidebarElement.style.top = ypos + 'px';
    }

    function onEndDrag() {
      console.log('End drag!!!');
      hide(dragOverlay);
      hide(glassPane);
      isDragging = false;
    }

    document.addEventListener('mousemove', event => {
      if (isDragging) {
        move(Math.max(event.clientX - relativeMouseDownX, 0), Math.max(event.clientY - relativeMouseDownY, 0));
      }
    });

    floatingSidebarElement.addEventListener('mousedown', event => {
      const divLeft = parseInt(floatingSidebarElement.style.left.replace('px', '')) || initialPos.left;
      const divTop = parseInt(floatingSidebarElement.style.top.replace('px', '')) || initialPos.top;
      relativeMouseDownX = event.clientX - divLeft;
      relativeMouseDownY = event.clientY - divTop;
      isDragging = true;
      show(dragOverlay);
      show(glassPane);
    });

    document.addEventListener('mouseup', onEndDrag);

    closeIcon.addEventListener('click', () => {
      hide(floatingSidebarElement);
    });

    hide(dragOverlay);
    hide(glassPane);

    addStyles();

    body.appendChild(floatingSidebarElement);
    body.appendChild(glassPane);

    return {
      hide() {
        hide(floatingSidebarElement);
      },
      show() {
        show(floatingSidebarElement);
      }
    };
  }


}