import type { Stats, Player } from '@/types/game'
import { getInnerSkill, innerSkillsToAcquire, INNER_SKILLS } from '@/config/innerSkillConfig'

export { getInnerSkill, innerSkillsToAcquire, INNER_SKILLS }

/** 当前装备的内功加成 */
export function innerSkillBonus(player: Player): Partial<Stats> {
  if (!player.innerSkill) return {}
  const s = getInnerSkill(player.innerSkill)
  return s ? s.stats : {}
}
