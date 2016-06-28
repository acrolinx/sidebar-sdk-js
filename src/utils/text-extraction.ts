/// <reference path="utils.ts" />


namespace acrolinx.plugins.utils.textextraction {
  'use strict';

  import _ = acrolinxLibs._;
  import OffSetAlign = acrolinx.plugins.utils.OffSetAlign;

  const REPLACE_SCRIPTS_REGEXP = '<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\/script>';
  const REPLACE_STYLES_REGEXP = '<style\\b[^<]*(?:(?!<\\/style>)<[^<]*)*<\/style>';
  const REPLACE_TAG_REGEXP = '<([^>]+)>';
  const REPLACE_ENTITY_REGEXP = '&.*?;';
  // Order is important.
  const REPLACE_TAGS_PARTS = [REPLACE_SCRIPTS_REGEXP, REPLACE_STYLES_REGEXP, REPLACE_TAG_REGEXP, REPLACE_ENTITY_REGEXP];
  const REPLACE_TAGS_REGEXP = '(' + REPLACE_TAGS_PARTS.join('|') + ')';

  export const NEW_LINE_TAGS = toSet(['BR', 'P', 'DIV']);
  export const AUTO_SELF_CLOSING_LINE_TAGS = toSet(['BR']);


  function getTagReplacement(completeTag: string): string {
    const [slash1='', tagName='', slash2=''] = ((/^<(\/?)(\w+)/i).exec(completeTag.toUpperCase()) || []).slice(1);
    if (tagName) {
      if (AUTO_SELF_CLOSING_LINE_TAGS[tagName] ||
        (NEW_LINE_TAGS[tagName] && (slash1 || slash2))) {
        return '\n';
      }
    }
    return '';
  }

  // Exported for testing
  export function extractText(s: string): [string, OffSetAlign[]] {
    const regExp = new RegExp(REPLACE_TAGS_REGEXP, 'ig');
    const offsetMapping: OffSetAlign[] = [];
    let currentDiffOffset = 0;
    const resultText = s.replace(regExp, (tagOrEntity, p1, p2, offset) => {
      const rep = _.startsWith(tagOrEntity, '&') ? decodeEntities(tagOrEntity) : getTagReplacement(tagOrEntity);
      currentDiffOffset -= tagOrEntity.length - rep.length;
      offsetMapping.push({
        oldPosition: offset + tagOrEntity.length,
        diffOffset: currentDiffOffset
      });
      return rep;
    });
    return [resultText, offsetMapping];
  }

  function decodeEntities(entity: string) {
    const el = document.createElement('div');
    el.innerHTML = entity;
    return el.textContent;
  }


}