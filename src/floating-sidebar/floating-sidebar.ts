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

import { assign, removeNode } from '../utils/utils';
import { AsyncStorage } from './async-storage';

export const SIDEBAR_ID = 'acrolinxFloatingSidebar';
export const TITLE_BAR_CLASS = 'acrolinxFloatingSidebarTitleBar';
export const CLOSE_ICON_CLASS = 'acrolinxFloatingSidebarCloseIcon';
export let SIDEBAR_CONTAINER_ID = 'acrolinxSidebarContainer';
export const SIDEBAR_DRAG_OVERLAY_ID = 'acrolinxDragOverlay';
export const SIDEBAR_GLASS_PANE_ID = 'acrolinxFloatingSidebarGlassPane';
export const FOOTER = 'acrolinxFloatingSidebarFooter';
export const RESIZE_ICON_CLASS = 'acrolinxFloatingSidebarResizeIcon';

export const IS_RESIZING_CLASS = 'acrolinxFloatingSidebarIsResizing';
export const IS_DRAGGED_CLASS = 'acrolinxFloatingSidebarIsDragged';

export const FOOTER_HEIGHT = 34;

const HIDE_ICON =
  'PHN2ZyBmaWxsPSIjZmZmZmZmIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KICAgIDxwYXRoIGQ9Ik0xOSAxOUg1VjVoN1YzSDVjLTEuMTEgMC0yIC45LTIgMnYxNGMwIDEuMS44OSAyIDIgMmgxNGMxLjEgMCAyLS45IDItMnYtN2gtMnY3ek0xNCAzdjJoMy41OWwtOS44MyA5LjgzIDEuNDEgMS40MUwxOSA2LjQxVjEwaDJWM2gtN3oiLz4KPC9zdmc+';
const RESIZE_ICON =
  'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJFYmVuZV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI0IDI0OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6IzkwOTA5MDt9Cgkuc3Qxe2ZpbGw6bm9uZTt9Cjwvc3R5bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik03LjMsMjFoOS41di0ySDcuM1YyMXogTTcuMywxN2g5LjV2LTJINy4zVjE3eiBNNy4zLDEzaDkuNXYtMkg3LjNWMTN6IE03LjMsOWg5LjVWN0g3LjNWOXogTTcuMywzdjJoOS41VjNINy4zCgl6Ii8+CjxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0wLDBoMjR2MjRIMFYweiIvPgo8L3N2Zz4K';

// Smaller than the biggest 32-bit int (2147483647) but bigger than the menu of youtube.
const Z_INDEX = 2000000000;

export interface PositionUpdate {
  top?: number;
  left?: number;
  height?: number;
}

export interface Position extends PositionUpdate {
  top: number;
  left: number;
  height: number;
}

const MAX_INITIAL_HEIGHT = 900;
const MIN_INITIAL_HEIGHT = 400;
const MIN_HEIGHT = 400;

export const DEFAULT_POS: Position = Object.freeze({
  top: 20,
  left: 20,
  height: MIN_INITIAL_HEIGHT,
});

export const POSITION_KEY = 'acrolinx.plugins.floatingSidebar.position';

/**
 * Exported only for testing.
 */
export function loadInitialPos(asyncStorage: AsyncStorage): Promise<Position> {
  const defaultPos = {
    top: DEFAULT_POS.top,
    left: DEFAULT_POS.left,
    height: sanitizeHeight(window.innerHeight - DEFAULT_POS.top - 40),
  };
  return asyncStorage.get<Position>(POSITION_KEY).then(
    (loadedPosition) => ({ ...defaultPos, ...loadedPosition }),
    (e: Error) => {
      console.error("Can't load saved sidebar position.", e);
      return defaultPos;
    },
  );
}

function sanitizeHeight(floatingSidebarHeight: number) {
  return Math.max(MIN_HEIGHT, Math.min(MAX_INITIAL_HEIGHT, floatingSidebarHeight));
}

/**
 * Exported only for testing.
 */
export function keepVisible(
  { left, top, height }: Position,
  windowWidth: number = window.innerWidth,
  windowHeight: number = window.innerHeight,
): Position {
  const minVerticalMargin = 30;
  const minHorizontalMargin = 150;
  if (top <= 0) {
    top = 20;
  }
  if (left <= 0) {
    left = 20;
  }
  return {
    left: left > windowWidth - minHorizontalMargin ? windowWidth - minHorizontalMargin : left,
    top: top > windowHeight - minVerticalMargin ? windowHeight - minVerticalMargin : top,
    height: height > windowHeight ? sanitizeHeight(windowHeight - 10) : height,
  };
}

function addStyles() {
  const styleTag = document.createElement('style');
  const head = document.querySelector('head')!;
  styleTag.textContent = `
      #${SIDEBAR_ID} {
        top: ${DEFAULT_POS.top}px;
        left: ${DEFAULT_POS.left}px;
        position: fixed;
        width: 300px;
        padding-top: 0px;
        cursor: move;
        background: #000000;
        box-shadow: 5px 5px 30px rgba(0, 0, 0, 0.3);
        border-radius: 3px;
        user-select: none;
        z-index: ${Z_INDEX};
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        overflow: hidden;
        transition: top 1s, left 1s;
        transition-timing-function: ease-out;
        display: none;
      }

      #${SIDEBAR_ID}.${IS_DRAGGED_CLASS} {
        transition: none;
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
        bottom: ${FOOTER_HEIGHT}px;
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
        z-index: ${Z_INDEX + 100};
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
        z-index: ${Z_INDEX - 100};
      }

      #${SIDEBAR_ID} .${FOOTER} {
        position: absolute;
        bottom: 0;
        background: white;
        width: 100%;
        height: ${FOOTER_HEIGHT}px;
        border-top: 1px solid #dadada;
      }

      #${SIDEBAR_ID} .${RESIZE_ICON_CLASS} {
        position: absolute;
        right: 3px;
        bottom: 5px;
        font-size: 20px;
        font-weight: normal;
        color: #333;
        cursor: ns-resize;
        width: 24px;
        height: 24px;
        background-repeat: no-repeat;
        background-image: url("data:image/svg+xml;base64,${RESIZE_ICON}");
        -webkit-background-size: cover;
        -moz-background-size: cover;
        -o-background-size: cover;
        background-size: cover;
      }

      #${SIDEBAR_ID}.${IS_RESIZING_CLASS},
      #${SIDEBAR_GLASS_PANE_ID}.${IS_RESIZING_CLASS} {
        cursor: ns-resize !important;
      }
    `;
  head.appendChild(styleTag);
}

function createTemplate(): string {
  return `
    <div id="${SIDEBAR_ID}">
      <div class="${TITLE_BAR_CLASS}">Acrolinx <span class="${CLOSE_ICON_CLASS}" title="Hide"></span></div>
      <div id="${SIDEBAR_CONTAINER_ID}"></div>
      <div id="${SIDEBAR_DRAG_OVERLAY_ID}"></div>
      <div class="${FOOTER}"><div class="${RESIZE_ICON_CLASS}" title="Drag to resize"></div></div>
    </div>
  `;
}

function createDiv(attributes: { [attribute: string]: string }): HTMLElement {
  const el = document.createElement('div');
  Object.assign(el, attributes);
  return el;
}

function hide(el: HTMLElement) {
  el.style.display = 'none';
}

function show(el: HTMLElement) {
  el.style.display = 'block';
}

function createNodeFromTemplate(template: string): HTMLElement {
  return createDiv({ innerHTML: template.trim() }).firstChild as HTMLElement;
}

export interface FloatingSidebar {
  toggleVisibility(): void;
  remove(): void;
}

export interface FloatingSidebarConfig {
  asyncStorage: AsyncStorage;
  sidebarContainerId?: string;
}

export function initFloatingSidebar(config: FloatingSidebarConfig): FloatingSidebar {
  if (config.sidebarContainerId) {
    SIDEBAR_CONTAINER_ID = config.sidebarContainerId;
  }

  let position = DEFAULT_POS;
  const template = createTemplate();
  const floatingSidebarElement = createNodeFromTemplate(template);
  const dragOverlay = floatingSidebarElement.querySelector('#' + SIDEBAR_DRAG_OVERLAY_ID) as HTMLElement;
  const closeIcon = floatingSidebarElement.querySelector('.' + CLOSE_ICON_CLASS) as HTMLElement;
  const resizeIcon = floatingSidebarElement.querySelector('.' + RESIZE_ICON_CLASS) as HTMLElement;
  const glassPane = createDiv({ id: SIDEBAR_GLASS_PANE_ID });
  const body = document.querySelector('body')!;
  let isMoving = false;
  let isResizing = false;
  let relativeMouseDownX = 0;
  let relativeMouseDownY = 0;
  let isVisible = true;

  function move(positionUpdate: PositionUpdate) {
    position = assign(position, positionUpdate);
    floatingSidebarElement.style.left = position.left + 'px';
    floatingSidebarElement.style.top = position.top + 'px';
    floatingSidebarElement.style.height = position.height + 'px';
  }

  function onEndDrag() {
    hide(dragOverlay);
    hide(glassPane);
    isMoving = false;
    isResizing = false;
    floatingSidebarElement.classList.remove(IS_RESIZING_CLASS);
    floatingSidebarElement.classList.remove(IS_DRAGGED_CLASS);
    glassPane.classList.remove(IS_RESIZING_CLASS);
    savePosition();
  }

  function savePosition() {
    config.asyncStorage.set(POSITION_KEY, position).catch((error) => {
      console.error('Error in FloatingSidebar.savePosition:', error);
    });
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
      pullInAnimationIfNeeded();
    }
  }

  document.addEventListener('mousemove', (event) => {
    if (isMoving) {
      move({
        left: Math.max(event.clientX - relativeMouseDownX, 0),
        top: Math.max(event.clientY - relativeMouseDownY, 0),
      });
    }
    if (isResizing) {
      const floatingSidebarTop = floatingSidebarElement.getBoundingClientRect().top;
      const iconPositionOffset = 30;
      move({
        height: Math.max(event.clientY - relativeMouseDownY + iconPositionOffset - floatingSidebarTop, MIN_HEIGHT),
      });
    }
  });

  floatingSidebarElement.addEventListener('mousedown', (event) => {
    const { top, left } = floatingSidebarElement.getBoundingClientRect();
    relativeMouseDownX = event.clientX - left;
    relativeMouseDownY = event.clientY - top;
    isMoving = true;
    show(dragOverlay);
    show(glassPane);
    floatingSidebarElement.classList.add(IS_DRAGGED_CLASS);
  });

  resizeIcon.addEventListener('mousedown', (event) => {
    relativeMouseDownY = event.clientY - resizeIcon.getBoundingClientRect().top;
    isResizing = true;
    floatingSidebarElement.classList.add(IS_RESIZING_CLASS);
    glassPane.classList.add(IS_RESIZING_CLASS);
    show(dragOverlay);
    show(glassPane);
    event.stopPropagation();
  });

  function onResize() {
    if (isVisible) {
      move(keepVisible(position));
    }
  }

  function pullInAnimationIfNeeded() {
    // Timeout & css transition create a nice transition effect:
    // If the sidebar is outside of the window, it's pulled in.
    setTimeout(() => {
      move(keepVisible(position));
    }, 1);
  }

  // Currently only used for testing.
  function remove() {
    removeNode(floatingSidebarElement);
    removeNode(glassPane);
    removeNode(dragOverlay);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('mouseup', onEndDrag);
  }

  document.addEventListener('mouseup', onEndDrag);
  window.addEventListener('resize', onResize);

  closeIcon.addEventListener('click', hideFloatingSidebar);

  hide(dragOverlay);
  hide(glassPane);

  addStyles();

  loadInitialPos(config.asyncStorage)
    .then((loadedPosition) => {
      show(floatingSidebarElement);
      move(loadedPosition);
      pullInAnimationIfNeeded();
    })
    .catch((error) => {
      console.error('Error while trying to set initial position of FloatingSidebar:', error);
    });

  body.appendChild(floatingSidebarElement);
  body.appendChild(glassPane);

  return { toggleVisibility, remove };
}
