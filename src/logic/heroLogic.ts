import type { Hero, Player, Stats, Equipment, EquipSlot } from '@/types/game'
import { HEROES, getHero } from '@/config/heroConfig'
import { ALL_SLOTS } from '@/config/equipmentConfig'
import { sectInnerBonus } from './innerSkillLogic'

export { getHero, HEROES }

/** 通关 levelId 后应获得的侠客 */
export function heroesToAcquire(levelId: string): Hero[] {
  return HEROES.filter((h) => h.acquireLevelId === levelId)
}

/** 上阵侠客列表（按 formation 顺序，跳过空位与未拥有） */
export function formationHeroes(player: Player): Hero[] {
  return player.formation
    .map((id) => (id ? getHero(id) : null))
    .filter((h): h is Hero => !!h)
}

/** 侠客升到下一级所需经验 */
export function heroExpToNext(level: number): number {
  return Math.floor(80 * Math.pow(level, 1.4))
}

/** 计算侠客实际属性 = 基础×成长(每级+8%) + 装备(6 槽，按星放大) + 门派内功 */
export function computeHeroStats(
  hero: Hero,
  level: number,
  equipped: Record<EquipSlot, Equipment | null>,
  sectId?: string | null
): Stats {
  const growth = 1 + (level - 1) * 0.08
  const stats: Stats = {
    hp: Math.floor(hero.stats.hp * growth),
    atk: Math.floor(hero.stats.atk * growth),
    def: Math.floor(hero.stats.def * growth),
    spd: Math.floor(hero.stats.spd * growth),
    critRate: hero.stats.critRate,
    critDmg: hero.stats.critDmg
  }
  for (const slot of ALL_SLOTS) {
    const eq = equipped[slot]
    if (!eq) continue
    const mult = 1 + (eq.star || 0) * 0.15
    for (const k in eq.stats) {
      const key = k as keyof Stats
      stats[key] += (eq.stats[key] ?? 0) * mult
    }
  }
  const sb = sectInnerBonus(sectId)
  for (const k in sb) {
    const key = k as keyof Stats
    stats[key] += sb[key] ?? 0
  }
  return stats
}

/** 构造一个侠客的空 6 槽装备记录 */
export function emptyHeroEquipped(): Record<EquipSlot, Equipment | null> {
  return { weapon: null, armor: null, head: null, foot: null, accessory: null, neck: null }
}
