namespace acrolinx.plugins.floatingSidebar {
  'use strict';

  export const SIDEBAR_CONTAINER_ID = 'acrolinxSidebarContainer';

  function addStyles() {
    const styleTag = document.createElement('style');
    const head = document.querySelector('head');
    styleTag.innerHTML = `
      #acrolinxFloatingSidebar {
        top: 0;
        left: 0;
        position: fixed;
        width: 300px;
        padding-top: 20px;
        cursor: move;
        background: #3e96db;
        height: 500px;
        box-shadow: 5px 5px 30px rgba(0, 0, 0, 0.3);
        border-radius: 3px;
        user-select: none;
      }
  
      #acrolinxFloatingSidebar #${SIDEBAR_CONTAINER_ID},
      #acrolinxFloatingSidebar #${SIDEBAR_CONTAINER_ID} iframe {
        background: white;
        height: 100%;
        border: none;
      }
    `;
    head.appendChild(styleTag);
  }

  export function initFloatingSidebar() {
    const floatingSidebarElement = document.createElement('div');
    floatingSidebarElement.id = 'acrolinxFloatingSidebar';
    const body = document.querySelector('body');
    let isDragging = false;
    let relativeMouseDownX = 0;
    let relativeMouseDownY = 0;

    function move(xpos: number, ypos: number) {
      floatingSidebarElement.style.left = xpos + 'px';
      floatingSidebarElement.style.top = ypos + 'px';
    }

    document.addEventListener('mousemove', event => {
      if (isDragging) {
        move(Math.max(event.clientX - relativeMouseDownX, 0), Math.max(event.clientY - relativeMouseDownY, 0));
      }
    });


    floatingSidebarElement.addEventListener('mousedown', event => {
      const divTop = parseInt(floatingSidebarElement.style.top.replace('px', '')) || 0;
      const divLeft = parseInt(floatingSidebarElement.style.left.replace('px', '')) || 0;
      relativeMouseDownX = event.clientX - divLeft;
      relativeMouseDownY = event.clientY - divTop;
      isDragging = true;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    floatingSidebarElement.innerHTML = `<div id="${SIDEBAR_CONTAINER_ID}"></div>`;

    addStyles();
    body.appendChild(floatingSidebarElement);
  }


}