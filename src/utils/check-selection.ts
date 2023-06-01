/*
 * Copyright 2017-present Acrolinx GmbH
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

import * as _ from 'lodash';

function getRangesOfCurrentSelection(doc: Document): Range[] {
  const selection = doc.getSelection();

  if (!selection) {
    return [];
  }

  const ranges = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    ranges.push(selection.getRangeAt(i));
  }
  return ranges;
}

function getNonEmptySelectedRangesInsideOf(editorElement: HTMLElement): Range[] {
  if (!editorElement.ownerDocument) {
    return [];
  }
  const ranges = getRangesOfCurrentSelection(editorElement.ownerDocument);
  return ranges.filter(
    (range) => containsOrIs(editorElement, range.commonAncestorContainer) && range.toString().trim() !== '',
  );
}

/**
 * Workaround for Node.contains which does not work in IE for text nodes.
 * https://connect.microsoft.com/IE/feedback/details/780874/node-contains-is-incorrect
 */
function containsOrIs(ancestor: HTMLElement, descendant: Node) {
  return ancestor === descendant || descendant.compareDocumentPosition(ancestor) & Node.DOCUMENT_POSITION_CONTAINS;
}

function getNodePath(ancestor: HTMLElement, node: Node): number[] {
  const result: number[] = [];
  let currentNode = node;
  while (currentNode !== ancestor) {
    const parent = currentNode.parentNode;
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
  for (const nodeIndex of path) {
    const childNode = currentNode.childNodes[nodeIndex];
    if (!childNode) {
      return undefined;
    }
    currentNode = childNode;
  }
  return currentNode;
}

// These markers should never appear in a real document and they should not contain any chars that need escaping.
const RANGE_MARKER_START = 'ACROOO_SELECTION_START';
const RANGE_MARKER_END = 'ACROOO_SELECTION_END';

type ElementHtmlGetter = (el: HTMLElement) => string;

function mapDomRangeToHtmlRange(
  editorElement: HTMLElement,
  range: Range,
  getElementHtml: ElementHtmlGetter,
): [number, number] | undefined {
  const doc = editorElement.ownerDocument;
  if (!doc) {
    return undefined;
  }

  // Find node-path of range.
  const rangeStartElementPath = getNodePath(editorElement, range.startContainer);
  const rangeEndElementPath = getNodePath(editorElement, range.endContainer);

  const clonedEditorElement = editorElement.cloneNode(true) as HTMLElement;

  // Find start and end elements of range in clonedEditorElement again.
  const clonedStartElement = findNodeByPath(clonedEditorElement, rangeStartElementPath);
  const clonedEndElement = findNodeByPath(clonedEditorElement, rangeEndElementPath);
  if (!clonedStartElement || !clonedEndElement) {
    return undefined;
  }

  // Construct range in clonedEditorElement.
  const clonedRange = doc.createRange();
  clonedRange.setStart(clonedStartElement, range.startOffset);
  clonedRange.setEnd(clonedEndElement, range.endOffset);

  // Insert markers.
  clonedRange.insertNode(doc.createTextNode(RANGE_MARKER_START));
  clonedRange.collapse(false); // collapse to End
  clonedRange.insertNode(doc.createTextNode(RANGE_MARKER_END));

  // Find position of markers in HTML of clonedEditorElement.
  const htmlWithMarkers = getElementHtml(clonedEditorElement);
  const htmlStartOffset = htmlWithMarkers.indexOf(RANGE_MARKER_START);
  const htmlEndOffset = htmlWithMarkers.indexOf(RANGE_MARKER_END);
  if (htmlStartOffset === -1 || htmlEndOffset === -1) {
    // Markers not found.
    return undefined;
  }

  return [htmlStartOffset, htmlEndOffset - RANGE_MARKER_START.length];
}

function getInnerHtml(el: HTMLElement): string {
  return el.innerHTML;
}

export function getSelectionHtmlRanges(
  editorElement: HTMLElement,
  getElementHtml: ElementHtmlGetter = getInnerHtml,
): [number, number][] {
  const ranges = getNonEmptySelectedRangesInsideOf(editorElement);
  // We could optimize this mapping of individual ranges by implementing a function
  // which maps all ranges at once, but this would probably increase code complexity just
  // to speed up the rare corner case of multiple ranges in a selection.
  return _.compact(ranges.map((range) => mapDomRangeToHtmlRange(editorElement, range, getElementHtml)));
}
