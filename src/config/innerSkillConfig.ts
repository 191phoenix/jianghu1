import type { Stats } from '@/types/game'

export interface InnerSkillDef {
  id: string
  name: string
  desc: string
  stats: Partial<Stats>
  acquireLevelId: string
}

/** 4 个内功，通关特定关卡获取 */
export const INNER_SKILLS: InnerSkillDef[] = [
  { id: 'xiaowuxiang', name: '小无相功', desc: '内息运转，攻击 +8', stats: { atk: 8 }, acquireLevelId: '1-2' },
  { id: 'jiuyang', name: '九阳神功', desc: '生生不息，气血 +80', stats: { hp: 80 }, acquireLevelId: '1-5' },
  { id: 'yijin', name: '易筋经', desc: '脱胎换骨，防御 +8', stats: { def: 8 }, acquireLevelId: '1-8' },
  { id: 'beiming', name: '北冥神功', desc: '海纳百川，全属性提升', stats: { atk: 5, hp: 50, def: 5, spd: 3 }, acquireLevelId: '2-10' }
]

export function getInnerSkill(id: string): InnerSkillDef | undefined {
  return INNER_SKILLS.find((s) => s.id === id)
}

/** 通关 levelId 后应获得的内功 */
export function innerSkillsToAcquire(levelId: string): InnerSkillDef[] {
  return INNER_SKILLS.filter((s) => s.acquireLevelId === levelId)
}
