/// <reference path="text-extraction.ts" />

import {_} from '../acrolinx-libs/acrolinx-libs-defaults';
import {toSet} from './utils';
import {NEW_LINE_TAGS} from './text-extraction';


export interface TextDomMapping {
  text: string;
  domPositions: DomPosition[];
}

export interface DomPosition {
  node: Node;
  offset: number;
}

const EMPTY_TEXT_DOM_MAPPING: TextDomMapping = Object.freeze({
  text: '',
  domPositions: []
});


export function textMapping(text: string, domPositions: DomPosition[]): TextDomMapping {
  return {
    text: text,
    domPositions: domPositions
  };
}

export function concatTextMappings(textMappings: TextDomMapping[]): TextDomMapping {
  return {
    text: textMappings.map(tm => tm.text).join(''),
    domPositions: <DomPosition[]> _.flatten(textMappings.map(tm => tm.domPositions))
  };
}

export function domPosition(node: Node, offset: number): DomPosition {
  return {
    node: node,
    offset: offset
  };
}

const IGNORED_NODE_NAMES = toSet(['SCRIPT', 'STYLE']);

export function extractTextDomMapping(node: Node): TextDomMapping {
  return concatTextMappings(_.map(node.childNodes, (child: Node) => {
      switch (child.nodeType) {
        case Node.ELEMENT_NODE:
          const nodeName = child.nodeName;
          if (IGNORED_NODE_NAMES[nodeName]) {
            return EMPTY_TEXT_DOM_MAPPING;
          }
          const childMappings = extractTextDomMapping(<HTMLElement> child);
          if (NEW_LINE_TAGS[nodeName]) {
            const lastChildDomPos = _.last(childMappings.domPositions);
            return {
              text: childMappings.text + '\n',
              domPositions: childMappings.domPositions.concat({
                node: (lastChildDomPos && lastChildDomPos.node) || child,
                offset: (lastChildDomPos && lastChildDomPos.offset) || 0
              })
            };
          }
          return childMappings;
        case Node.TEXT_NODE:
        default:
          return textMapping(child.textContent, _.times(child.textContent.length, (i: number) => domPosition(child, i)));
      }
    }
  ));
}

export function getEndDomPos(endIndex: number, domPositions: DomPosition[]): DomPosition {
  const index = domPositions[Math.max(Math.min(endIndex, domPositions.length) - 1, 0)];
  return {
    node: index.node,
    offset: index.offset + 1
  };
}
