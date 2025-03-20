import { AlignedMatch } from './alignment';
import { Match } from '@acrolinx/sidebar-interface';

export function getCompleteFlagLength<T extends Match>(matches: AlignedMatch<T>[]) {
  return matches[matches.length - 1].range[1] - matches[0].range[0];
}

export function rangeContent(content: string, m: { range: [number, number] }) {
  return content.slice(m.range[0], m.range[1]);
}

/**
 * We don't want to destroy markup/markdown.
 */
export function isDangerousToReplace(checkedDocumentContent: string, originalMatch: Match) {
  return (
    /^ *$/.test(originalMatch.content) && originalMatch.content != rangeContent(checkedDocumentContent, originalMatch)
  );
}
