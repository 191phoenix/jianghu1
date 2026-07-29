import type { Player, Stats, EquipSlot } from '@/types/game'

const BASE_STATS: Stats = { hp: 100, atk: 10, def: 5, spd: 10, critRate: 0.05, critDmg: 1.5 }

/** 按等级计算基础属性（不含装备） */
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

/** 计算玩家总属性（基础 + 装备加成） */
export function computePlayerStats(player: Player): Stats {
  const total = { ...baseStatsByLevel(player.level) }
  const slots: EquipSlot[] = ['weapon', 'armor', 'accessory']
  for (const slot of slots) {
    const eq = player.equipped[slot]
    if (eq) {
      for (const k in eq.stats) {
        const key = k as keyof Stats
        total[key] += eq.stats[key] ?? 0
      }
    }
  }
  return total
}
