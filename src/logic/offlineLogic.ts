import type { OfflineReward, Equipment } from '@/types/game'
import { maxClearedLevel } from './levelLogic'
import { rollDrop } from './equipmentLogic'

const MAX_OFFLINE_SEC = 8 * 3600
const SEC_PER_SWEEP = 30

/** 离线挂机结算：按离线时长扫荡最高已通关卡，结算经验与掉落 */
export function settleOffline(
  lastActiveTime: number,
  now: number,
  clearedLevelIds: string[]
): OfflineReward | null {
  const duration = Math.min(Math.max(0, Math.floor((now - lastActiveTime) / 1000)), MAX_OFFLINE_SEC)
  if (duration < 60) return null

  const maxLevel = maxClearedLevel(clearedLevelIds)
  if (!maxLevel) return null

  const sweeps = Math.floor(duration / SEC_PER_SWEEP)
  let exp = 0
  const drops: Equipment[] = []
  for (let i = 0; i < sweeps; i++) {
    for (const e of maxLevel.enemies) {
      exp += e.expReward
      const d = rollDrop(e, maxLevel.index)
      if (d) drops.push(d)
    }
  }
  return { duration, exp, drops, levelId: maxLevel.id }
}
