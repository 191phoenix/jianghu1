import type { Hero, Player } from '@/types/game'
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
