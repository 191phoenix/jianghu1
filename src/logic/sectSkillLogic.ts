import type { Sect, SectSkill, SkillDef } from '@/types/game'

/** 从 level 升到 level+1 的银两花费 */
export function SKILL_LEVEL_COST(level: number): number {
  return 50 * (level + 1)
}

/** 某武功当前等级（0 = 未习得） */
export function skillLevel(levels: Record<string, number>, id: string): number {
  return levels[id] || 0
}

/** 门派基础武功(tier 1) */
export function baseSkillOf(sect: Sect): SectSkill | undefined {
  return sect.skills.find((s) => s.tier === 1)
}

/** 前置是否达标（无前置视为达标） */
export function prereqMet(skill: SectSkill, levels: Record<string, number>): boolean {
  if (!skill.prereq) return true
  return skillLevel(levels, skill.prereq.skillId) >= skill.prereq.level
}

/** 已习得则返回有效 SkillDef（倍率随等级提升），否则 null */
export function effectiveSectSkill(
  sect: Sect,
  skillId: string | null | undefined,
  levels: Record<string, number>
): SkillDef | null {
  if (!skillId) return null
  const node = sect.skills.find((s) => s.id === skillId)
  if (!node) return null
  const lvl = skillLevel(levels, skillId)
  if (lvl < 1) return null
  return {
    name: node.name,
    desc: node.desc,
    trigger: { type: 'every-n-rounds', n: node.cdN },
    multiplier: node.multiplier + (lvl - 1) * 0.15
  }
}
