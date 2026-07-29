import type { Stats, Player } from '@/types/game'
import { getInnerSkill, innerSkillsToAcquire, INNER_SKILLS } from '@/config/innerSkillConfig'
import { SECTS } from '@/config/sectConfig'

export { getInnerSkill, innerSkillsToAcquire, INNER_SKILLS }

/** 当前装备的内功加成 */
export function innerSkillBonus(player: Player): Partial<Stats> {
  if (!player.innerSkill) return {}
  const s = getInnerSkill(player.innerSkill)
  return s ? s.stats : {}
}

/** 门派内功心法加成（拜入门派即得，独立于通关内功池） */
export function sectInnerBonus(sectId: string | undefined | null): Partial<Stats> {
  if (!sectId) return {}
  return SECTS[sectId]?.inner?.stats ?? {}
}
