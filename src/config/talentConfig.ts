import type { Stats } from '@/types/game'

export interface TalentDef {
  key: string
  label: string
  desc: string
  perLevel: Partial<Stats> & { expBonus?: number }
}

/** 4 个线性天赋 */
export const TALENTS: TalentDef[] = [
  { key: 'sharp', label: '锐利', desc: '每级 +3 攻击', perLevel: { atk: 3 } },
  { key: 'tough', label: '坚韧', desc: '每级 +30 气血', perLevel: { hp: 30 } },
  { key: 'agile', label: '灵动', desc: '每级 +2% 暴击', perLevel: { critRate: 0.02 } },
  { key: 'wise', label: '悟性', desc: '每级 +5% 经验获取', perLevel: { expBonus: 0.05 } }
]

/** 每升 N 级获得 1 天赋点 */
export const TALENT_POINT_EVERY_LEVELS = 2
