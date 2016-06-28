namespace acrolinx.plugins.utils.textextraction {

  import _ = acrolinxLibs._;
  import OffSetAlign = acrolinx.plugins.utils.OffSetAlign;

  const REPLACE_SCRIPTS_REGEXP = '<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\/script>';
  const REPLACE_STYLES_REGEXP = '<style\\b[^<]*(?:(?!<\\/style>)<[^<]*)*<\/style>';
  const REPLACE_TAG_REGEXP = '<([^>]+)>';
  const REPLACE_ENTITY_REGEXP = '&.*?;';
  // Order is important.
  const REPLACE_TAGS_PARTS = [REPLACE_SCRIPTS_REGEXP, REPLACE_STYLES_REGEXP, REPLACE_TAG_REGEXP, REPLACE_ENTITY_REGEXP];
  const REPLACE_TAGS_REGEXP = '(' + REPLACE_TAGS_PARTS.join('|') + ')';

  // Exported for testing
  export function extractText(s: string): [string, OffSetAlign[]] {
    const regExp = new RegExp(REPLACE_TAGS_REGEXP, 'ig');
    const offsetMapping: OffSetAlign[] = [];
    let currentDiffOffset = 0;
    const resultText = s.replace(regExp, (tagOrEntity, p1, p2, offset) => {
      const rep = _.startsWith(tagOrEntity, '&') ? decodeEntities(tagOrEntity) : '';
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