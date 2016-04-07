namespace acrolinx.plugins.utils {

  import _ = acrolinxLibs._;

  export function logTime(text: string, f: Function) {
    const startTime = Date.now();
    const result = f();
    console.log(`Duration of "${text}:"`, Date.now() - startTime);
    return result;
  }

  export interface TextDomMapping {
    text: string
    domPositions: DomPosition[]
  }

  export interface DomPosition {
    node: Node
    offset: number
  }


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

  export function extractTextDomMapping(node: Node): TextDomMapping {
    return concatTextMappings(_.map(node.childNodes, child=> {
      switch (child.nodeType) {
        case Node.ELEMENT_NODE:
          return extractTextDomMapping(<HTMLElement> child);
        case Node.TEXT_NODE:
        default:
          return textMapping(child.textContent, _.times(child.textContent.length, i => domPosition(child, i)));
      }
    }));
  }

  export function getEndDomPos(index: number, domPositions: DomPosition[]): DomPosition {
    if (index < domPositions.length) {
      return domPositions[index];
    } else {
      const lastDOMPos = _.last(domPositions);
      return {
        node: lastDOMPos.node,
        offset: lastDOMPos.offset + 1
      };
    }
  }

}