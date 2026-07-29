import type { OfflineReward, Equipment } from '@/types/game'
import { maxClearedLevel } from './levelLogic'
import { rollDrop, rollStones } from './equipmentLogic'

const MAX_OFFLINE_SEC = 8 * 3600
const SEC_PER_SWEEP = 30

/** 离线挂机结算：按离线时长扫荡最高已通关卡，结算经验/掉落/强化石 */
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
  const levelIdx = (maxLevel.chapter - 1) * 10 + maxLevel.index
  let exp = 0
  let stones = 0
  const drops: Equipment[] = []
  for (let i = 0; i < sweeps; i++) {
    for (const e of maxLevel.enemies) {
      exp += e.expReward
      const d = rollDrop(e, levelIdx)
      if (d) drops.push(d)
      stones += rollStones(e)
    }
  }
  return { duration, exp, drops, stones, levelId: maxLevel.id }
}
