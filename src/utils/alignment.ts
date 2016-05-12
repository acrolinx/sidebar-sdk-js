namespace acrolinx.plugins.utils {
  import _ = acrolinxLibs._;

  export interface OffSetAlign {
    oldPosition: number;
    diffOffset: number;
  }

  export function findDisplacement(offsetMappingArray: OffSetAlign[], originalIndex: number) {
    if (offsetMappingArray.length === 0) {
      return 0;
    }
    const index = _.sortedIndexBy(offsetMappingArray,
      {diffOffset: 0, oldPosition: originalIndex + 0.1},
      offsetAlign => offsetAlign.oldPosition
    );
    return index > 0 ? offsetMappingArray[index - 1].diffOffset : 0;
  }

  export function findNewIndex(offsetMappingArray: OffSetAlign[], originalIndex: number) {
    return originalIndex + findDisplacement(offsetMappingArray, originalIndex);
  }

}