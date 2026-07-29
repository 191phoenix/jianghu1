import type { Player, Stats } from '@/types/game'
import { ALL_SLOTS } from '@/config/equipmentConfig'
import { talentBonus } from './talentLogic'
import { innerSkillBonus } from './innerSkillLogic'

const BASE_STATS: Stats = { hp: 100, atk: 10, def: 5, spd: 10, critRate: 0.05, critDmg: 1.5 }

/** 按等级计算基础属性（不含装备/天赋/内功） */
export function baseStatsByLevel(level: number): Stats {
  const l = level - 1
  return {
    hp: BASE_STATS.hp + l * 20,
    atk: BASE_STATS.atk + l * 2,
    def: BASE_STATS.def + l,
    spd: BASE_STATS.spd + l,
    critRate: BASE_STATS.critRate,
    critDmg: BASE_STATS.critDmg
  }
}

/**
 * 计算玩家总属性 = 基础 + 装备(按星数放大) + 天赋 + 内功
 */
export function computePlayerStats(player: Player): Stats {
  const total = { ...baseStatsByLevel(player.level) }

  // 装备，按 star 放大（每星 +15%）
  for (const slot of ALL_SLOTS) {
    const eq = player.equipped[slot]
    if (eq) {
      const mult = 1 + (eq.star || 0) * 0.15
      for (const k in eq.stats) {
        const key = k as keyof Stats
        total[key] += (eq.stats[key] ?? 0) * mult
      }
    }
  }

  // 天赋
  const tb = talentBonus(player.talents)
  for (const k in tb.stats) {
    const key = k as keyof Stats
    total[key] += tb.stats[key] ?? 0
  }

  // 内功
  const ib = innerSkillBonus(player)
  for (const k in ib) {
    const key = k as keyof Stats
    total[key] += ib[key] ?? 0
  }

  // 整数属性取整
  total.hp = Math.floor(total.hp)
  total.atk = Math.floor(total.atk)
  total.def = Math.floor(total.def)
  total.spd = Math.floor(total.spd)
  return total
}
