import * as _ from "lodash";

function getSelectedRangeInsideOf(editorElement: HTMLElement): Range | undefined {
  const selection = document.getSelection();
  // console.log('selection', selection);
  if (selection.rangeCount === 0) {
    return undefined;
  }
  // TODO: Care for multiple selections in tables in firefox?
  const range = selection.getRangeAt(0);
  // console.log('range', range);
  if (!containsOrIs(editorElement, range.commonAncestorContainer)) {
    // console.log('range is not in editorElement', range, range.commonAncestorContainer, editorElement);
    // console.log(range.commonAncestorContainer);
    // console.log(editorElement);
    return undefined;
  }
  if (range.toString().trim() === '') {
    // console.log('range is empty', range);
    return undefined;
  }
  return range;
}

/**
 * Workaround for Node.contains which does not work in IE for text nodes.
 * https://connect.microsoft.com/IE/feedback/details/780874/node-contains-is-incorrect
 */
function containsOrIs(ancestor: HTMLElement, descendant: Node) {
  return ancestor === descendant || (descendant.compareDocumentPosition(ancestor) & Node.DOCUMENT_POSITION_CONTAINS);
}


function getNodePath(ancestor: HTMLElement, node: Node): number[] {
  const result: number[] = [];
  let currentNode = node;
  // console.log('getNodePath');
  while (currentNode !== ancestor) {
    const parent = currentNode.parentNode;
    // console.log(currentNode, parent);
    if (!parent) {
      break;
    }
    const index = _.indexOf(parent.childNodes, currentNode);
    if (index === -1) {
      break;
    }
    result.push(index);
    currentNode = parent;
  }
  result.reverse();
  return result;
}

function findNodeByPath(ancestor: Node, path: number[]): Node | undefined {
  let currentNode: Node = ancestor;
  for (let nodeIndex of path) {
    let childNode = currentNode.childNodes[nodeIndex];
    if (!childNode) {
      return undefined;
    }
    currentNode = childNode;
  }
  return currentNode;
}

const RANGE_MARKER_START = 'ACRO_ßELECTION_START';
const RANGE_MARKER_END = 'ACRO_ßELECTION_END';

export function getSelectionHtmlRange(editorElement: HTMLElement): [number, number] | undefined {
  const range = getSelectedRangeInsideOf(editorElement);
  // console.log('Got Range', range);
  if (!range) {
    return undefined;
  }
  const rangeStartElementPath = getNodePath(editorElement, range.startContainer);
  const rangeEndElementPath = getNodePath(editorElement, range.endContainer);
  // console.log('range elements path', rangeStartElementPath, rangeEndElementPath);
  const clonedEditorElement = editorElement.cloneNode(true) as HTMLElement;
  const clonedStartElement = findNodeByPath(clonedEditorElement, rangeStartElementPath);
  const clonedEndElement = findNodeByPath(clonedEditorElement, rangeEndElementPath);
  if (!clonedStartElement || !clonedEndElement) {
    return undefined;
  }
  // console.log('cloned nodes', clonedStartElement, clonedEndElement);

  const clonedRange = document.createRange();
  clonedRange.setStart(clonedStartElement, range.startOffset);
  clonedRange.setEnd(clonedEndElement, range.endOffset);

  clonedRange.insertNode(document.createTextNode(RANGE_MARKER_START));
  clonedRange.collapse(false); // collapse to End
  clonedRange.insertNode(document.createTextNode(RANGE_MARKER_END));

  const htmlWithMarkers = clonedEditorElement.innerHTML;
  // console.log('htmlWithMarkers', htmlWithMarkers);
  const htmlStartOffset = htmlWithMarkers.indexOf(RANGE_MARKER_START);
  const htmlEndOffset = htmlWithMarkers.indexOf(RANGE_MARKER_END);
  if (htmlStartOffset === -1 || htmlEndOffset === -1) {
    // console.log('where are the markers?');
    return undefined;
  }

  return [htmlStartOffset, htmlEndOffset - RANGE_MARKER_START.length];
}
