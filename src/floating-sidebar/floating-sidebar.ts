namespace acrolinx.plugins.floatingSidebar {
  'use strict';

  export const SIDEBAR_ID = 'acrolinxFloatingSidebar';
  export const SIDEBAR_CONTAINER_ID = 'acrolinxSidebarContainer';
  export const SIDEBAR_DRAG_OVERLAY_ID = 'acrolinxDragOverlay';
  export const SIDEBAR_GLASS_PANE_ID = 'acrolinxFloatingSidebarGlassPane';

  const initialPos = {
    top: 100,
    left: 100
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
        padding-top: 20px;
        cursor: move;
        background: #3e96db;
        height: 500px;
        box-shadow: 5px 5px 30px rgba(0, 0, 0, 0.3);
        border-radius: 3px;
        user-select: none;
        z-index: 10000;
          -moz-user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
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

  function createDiv(id: string): HTMLElement {
    const el = document.createElement('div');
    el.id = id;
    return el;
  }

  function hide(el: HTMLElement) {
    el.style.display = 'none';
  }

  function show(el: HTMLElement) {
    el.style.display = 'block';
  }

  export function initFloatingSidebar() {
    const floatingSidebarElement = createDiv(SIDEBAR_ID);
    const dragOverlay = createDiv(SIDEBAR_DRAG_OVERLAY_ID);
    const glassPane = createDiv(SIDEBAR_GLASS_PANE_ID);
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

    floatingSidebarElement.appendChild(createDiv(SIDEBAR_CONTAINER_ID));
    hide(dragOverlay);
    floatingSidebarElement.appendChild(dragOverlay);

    addStyles();

    body.appendChild(floatingSidebarElement);
    hide(glassPane);
    body.appendChild(glassPane);

  }


}