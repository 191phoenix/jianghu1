import type { Hero, Player, Stats, Equipment } from '@/types/game'
import { HEROES, getHero } from '@/config/heroConfig'

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

/** 计算侠客实际属性 = 基础×成长(每级+8%) + 装备(按星放大) */
export function computeHeroStats(hero: Hero, level: number, equipped: Equipment | null): Stats {
  const growth = 1 + (level - 1) * 0.08
  const stats: Stats = {
    hp: Math.floor(hero.stats.hp * growth),
    atk: Math.floor(hero.stats.atk * growth),
    def: Math.floor(hero.stats.def * growth),
    spd: Math.floor(hero.stats.spd * growth),
    critRate: hero.stats.critRate,
    critDmg: hero.stats.critDmg
  }
  if (equipped) {
    const mult = 1 + (equipped.star || 0) * 0.15
    for (const k in equipped.stats) {
      const key = k as keyof Stats
      stats[key] += (equipped.stats[key] ?? 0) * mult
    }
  }
  return stats
}
