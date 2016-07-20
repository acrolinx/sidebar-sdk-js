import {_} from "../acrolinx-libs/acrolinx-libs-defaults";

export const SIDEBAR_ID = 'acrolinxFloatingSidebar';
export const TITLE_BAR_CLASS = 'acrolinxFloatingSidebarTitleBar';
export const CLOSE_ICON_CLASS = 'acrolinxFloatingSidebarCloseIcon';
export const SIDEBAR_CONTAINER_ID = 'acrolinxSidebarContainer';
export const SIDEBAR_DRAG_OVERLAY_ID = 'acrolinxDragOverlay';
export const SIDEBAR_GLASS_PANE_ID = 'acrolinxFloatingSidebarGlassPane';
export const RESIZE_ICON_CLASS = 'acrolinxFloatingSidebarResizeIcon';

export const IS_RESIZING_CLASS = 'acrolinxFloatingSidebarIsResizing';

const HIDE_ICON = 'PHN2ZyBmaWxsPSIjZmZmZmZmIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KICAgIDxwYXRoIGQ9Ik0xOSAxOUg1VjVoN1YzSDVjLTEuMTEgMC0yIC45LTIgMnYxNGMwIDEuMS44OSAyIDIgMmgxNGMxLjEgMCAyLS45IDItMnYtN2gtMnY3ek0xNCAzdjJoMy41OWwtOS44MyA5LjgzIDEuNDEgMS40MUwxOSA2LjQxVjEwaDJWM2gtN3oiLz4KPC9zdmc+';
const RESIZE_ICON = 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJFYmVuZV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI0IDI0OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6IzkwOTA5MDt9Cgkuc3Qxe2ZpbGw6bm9uZTt9Cjwvc3R5bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik03LjMsMjFoOS41di0ySDcuM1YyMXogTTcuMywxN2g5LjV2LTJINy4zVjE3eiBNNy4zLDEzaDkuNXYtMkg3LjNWMTN6IE03LjMsOWg5LjVWN0g3LjNWOXogTTcuMywzdjJoOS41VjNINy4zCgl6Ii8+CjxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0wLDBoMjR2MjRIMFYweiIvPgo8L3N2Zz4K';

const initialPos = {
  top: 20,
  left: 20
};


function addStyles() {
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
        background: #000000;
        box-shadow: 5px 5px 30px rgba(0, 0, 0, 0.3);
        border-radius: 3px;
        user-select: none;
        z-index: 10000;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        overflow: hidden;
      }
      
      #${SIDEBAR_ID} .${TITLE_BAR_CLASS} {
        position: relative;
        font-family: AcrolinxRoboto, Roboto, sans-serif;
        font-weight: 500;
        line-height: 13px;
        padding: 8px 10px;
        font-size: 13px;
        font-weight: normal;
        color: white;
      }
      
      #${SIDEBAR_ID} .${CLOSE_ICON_CLASS} {
        position: absolute;
        cursor: pointer;
        margin-right: 4px;
        top: 6px;
        right: 3px;
        width: 18px;
        height: 18px;
        background-repeat: no-repeat;
        background-image: url("data:image/svg+xml;base64,${HIDE_ICON}");
        -webkit-background-size: cover;
        -moz-background-size: cover;
        -o-background-size: cover;
        background-size: cover;
      }
      
      #${SIDEBAR_ID} #${SIDEBAR_CONTAINER_ID},
      #${SIDEBAR_ID} #acrolinxDragOverlay {
        position: absolute; 
        top: 30px;
        left: 0;
        bottom: 0;
        background: white;
      }
      
      #${SIDEBAR_ID} #${SIDEBAR_CONTAINER_ID} iframe {
        position: relative; 
        height: 100%;
        border: none;
      }
      
      #${SIDEBAR_ID} #${SIDEBAR_DRAG_OVERLAY_ID} {
        position: absolute;
        top: 20px;
        left: 0;
        height: 100%;
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
      
      #${SIDEBAR_ID} .${RESIZE_ICON_CLASS} {
        position: absolute;
        right: 3px;
        bottom: 5px;
        font-size: 20px;
        font-weight: normal;
        color: #333;
        z-index: 10002;
        cursor: ns-resize;
        transition: opacity 0.5s;
        width: 24px;
        height: 24px;
        background-repeat: no-repeat;
        background-image: url("data:image/svg+xml;base64,${RESIZE_ICON}");
        -webkit-background-size: cover;
        -moz-background-size: cover;
        -o-background-size: cover;
        background-size: cover;
      }
      
      #${SIDEBAR_ID} .${RESIZE_ICON_CLASS}:hover {
        opacity: 1;
      }
      
      #${SIDEBAR_ID}.${IS_RESIZING_CLASS},
      #${SIDEBAR_GLASS_PANE_ID}.${IS_RESIZING_CLASS} {
        cursor: ns-resize !important;
      }
      
    `;
  head.appendChild(styleTag);
}

const TEMPLATE = `
    <div id="${SIDEBAR_ID}">
      <div class="${TITLE_BAR_CLASS}">Acrolinx <span class="${CLOSE_ICON_CLASS}" title="Hide"></span></div>
      <div id="${SIDEBAR_CONTAINER_ID}"></div>
      <div id="${SIDEBAR_DRAG_OVERLAY_ID}"></div>
      <div class="${RESIZE_ICON_CLASS}" title="Drag to resize"></div>
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
  toggleVisibility(): void;
}

const MAX_INITIAL_HEIGHT = 900;
const MIN_INITIAL_HEIGHT = 400;
const MIN_HEIGHT = 400;

export function initFloatingSidebar(): FloatingSidebar {
  let height = Math.max(MIN_INITIAL_HEIGHT, Math.min(MAX_INITIAL_HEIGHT, window.innerHeight - initialPos.top - 240));
  const floatingSidebarElement = createNodeFromTemplate(TEMPLATE);
  const dragOverlay = floatingSidebarElement.querySelector('#' + SIDEBAR_DRAG_OVERLAY_ID) as HTMLElement;
  const closeIcon = floatingSidebarElement.querySelector('.' + CLOSE_ICON_CLASS) as HTMLElement;
  const resizeIcon = floatingSidebarElement.querySelector('.' + RESIZE_ICON_CLASS) as HTMLElement;
  const glassPane = createDiv({id: SIDEBAR_GLASS_PANE_ID});
  const body = document.querySelector('body');
  let isMoving = false;
  let isResizing = false;
  let relativeMouseDownX = 0;
  let relativeMouseDownY = 0;
  let isVisible = true;

  function move(xpos: number, ypos: number) {
    floatingSidebarElement.style.left = xpos + 'px';
    floatingSidebarElement.style.top = ypos + 'px';
  }

  function applyHeight(newHeight: number) {
    floatingSidebarElement.style.height = newHeight + 'px';
  }

  function onEndDrag() {
    hide(dragOverlay);
    hide(glassPane);
    isMoving = false;
    isResizing = false;
    floatingSidebarElement.classList.remove(IS_RESIZING_CLASS);
    glassPane.classList.remove(IS_RESIZING_CLASS);
  }

  function hideFloatingSidebar() {
    hide(floatingSidebarElement);
    isVisible = false;
  }

  function toggleVisibility() {
    if (isVisible) {
      hideFloatingSidebar();
    } else {
      show(floatingSidebarElement);
      isVisible = true;
    }
  }

  document.addEventListener('mousemove', event => {
    if (isMoving) {
      move(Math.max(event.clientX - relativeMouseDownX, 0), Math.max(event.clientY - relativeMouseDownY, 0));
    }
    if (isResizing) {
      const floatingSidebarTop = floatingSidebarElement.getBoundingClientRect().top;
      const iconPositionOffset = 30;
      height = Math.max(event.clientY  - relativeMouseDownY + iconPositionOffset - floatingSidebarTop, MIN_HEIGHT);
      applyHeight(height);
    }
  });

  function parsePXWithDefault(s: string | null, defaultValue: number) {
    return parseInt(s || '') || defaultValue;
  }

  floatingSidebarElement.addEventListener('mousedown', event => {
    const divLeft = parsePXWithDefault(floatingSidebarElement.style.left, initialPos.left);
    const divTop = parsePXWithDefault(floatingSidebarElement.style.top, initialPos.top);
    relativeMouseDownX = event.clientX - divLeft;
    relativeMouseDownY = event.clientY - divTop;
    isMoving = true;
    show(dragOverlay);
    show(glassPane);
  });

  resizeIcon.addEventListener('mousedown', event => {
    relativeMouseDownY = event.clientY - resizeIcon.getBoundingClientRect().top;
    isResizing = true;
    floatingSidebarElement.classList.add(IS_RESIZING_CLASS);
    glassPane.classList.add(IS_RESIZING_CLASS);
    show(dragOverlay);
    show(glassPane);
    event.stopPropagation();
  });

  document.addEventListener('mouseup', onEndDrag);

  closeIcon.addEventListener('click', hideFloatingSidebar);


  hide(dragOverlay);
  hide(glassPane);

  addStyles();
  applyHeight(height);

  body.appendChild(floatingSidebarElement);
  body.appendChild(glassPane);

  return {
    toggleVisibility: toggleVisibility
  };
}

