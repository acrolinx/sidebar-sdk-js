import {OffSetAlign} from "./alignment";

export interface EscapeHtmlCharactersResult {
  escapedText: string;
  backwardAlignment: OffSetAlign[];
}

const HTML_ESCAPES: {[key: string]: string} = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

export function escapeHtmlCharacters(text: string): EscapeHtmlCharactersResult {
  let escapedText = '';
  const backwardAlignment: OffSetAlign[] = [];
  let currentDiffOffset = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const escapedChar = HTML_ESCAPES[char];
    if (escapedChar) {
      const additionalChars = escapedChar.length - 1;
      currentDiffOffset = currentDiffOffset - additionalChars;
      backwardAlignment.push({
        oldPosition: escapedText.length + escapedChar.length,
        diffOffset: currentDiffOffset
      });
    }
    escapedText = escapedText + (escapedChar || char);
  }
  return {escapedText, backwardAlignment};
}