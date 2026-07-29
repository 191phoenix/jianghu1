import type { Stats, Player } from '@/types/game'
import { TALENTS, TALENT_POINT_EVERY_LEVELS } from '@/config/talentConfig'

export { TALENTS, TALENT_POINT_EVERY_LEVELS }

/** 按等级计算应获得的总天赋点（每 2 级 1 点） */
export function totalTalentPoints(level: number): number {
  return Math.floor(level / TALENT_POINT_EVERY_LEVELS)
}

/** 计算天赋加成（属性 + 经验加成） */
export function talentBonus(talents: Record<string, number>): {
  stats: Partial<Stats>
  expBonus: number
} {
  const stats: Partial<Stats> = {}
  let expBonus = 0
  for (const t of TALENTS) {
    const lvl = talents[t.key] || 0
    if (lvl <= 0) continue
    for (const k in t.perLevel) {
      if (k === 'expBonus') {
        expBonus += (t.perLevel.expBonus || 0) * lvl
        continue
      }
      const key = k as keyof Stats
      const add = (t.perLevel[key] as number) * lvl
      stats[key] = ((stats[key] as number) || 0) + add
    }
  }
  return { stats, expBonus }
}

/** 可用天赋点 = 总点数 - 已分配 */
export function availableTalentPoints(player: Player): number {
  const total = totalTalentPoints(player.level)
  const spent = Object.values(player.talents).reduce((s, v) => s + (v || 0), 0)
  return total - spent
}
