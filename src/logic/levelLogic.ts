import type { LevelDef } from '@/types/game'
import { getLevel } from '@/config/levelConfig'

/** 计算玩家最高已通关卡 */
export function maxClearedLevel(clearedLevelIds: string[]): LevelDef | undefined {
  const cleared = clearedLevelIds
    .map(getLevel)
    .filter((l): l is LevelDef => !!l)
    .sort((a, b) => a.index - b.index)
  return cleared[cleared.length - 1]
}
