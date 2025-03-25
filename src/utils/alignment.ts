import { Match } from '@acrolinx/sidebar-interface';

export interface OffSetAlign {
  oldPosition: number;
  diffOffset: number;
}

export interface AlignedMatch<T extends Match> {
  originalMatch: T;
  range: [number, number];
}

export function findDisplacement(offsetMappingArray: OffSetAlign[], originalIndex: number) {
  if (offsetMappingArray.length === 0) {
    return 0;
  }
  const index = sortedIndexBy(
    offsetMappingArray,
    { diffOffset: 0, oldPosition: originalIndex + 0.1 },
    (offsetAlign) => offsetAlign.oldPosition,
  );
  return index > 0 ? offsetMappingArray[index - 1].diffOffset : 0;
}

export function findNewIndex(offsetMappingArray: OffSetAlign[], originalIndex: number) {
  return originalIndex + findDisplacement(offsetMappingArray, originalIndex);
}

export function sortedIndexBy<T>(array: T[], value: T, iteratee: (item: T) => number): number {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (iteratee(array[mid]) < iteratee(value)) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}
