import type { Enemy, Equipment, Stats, EquipGrade } from '@/types/game'
import { rollEquipment, randomDropGrade, ALL_SLOTS } from '@/config/equipmentConfig'
import { genId } from '@/utils/id'

/** 击败敌人后按掉率掷骰生成装备（部位从 6 个中随机） */
export function rollDrop(enemy: Enemy, levelIdx: number): Equipment | null {
  if (Math.random() > enemy.dropRate) return null
  const slot = ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)]
  const grade = randomDropGrade(levelIdx)
  return rollEquipment(slot, grade, genId('eq'))
}

export const MAX_STAR = 5

/** 每强化 1 星的属性倍率 */
export const STAR_BONUS_PER_STAR = 0.2

/**
 * 单条属性经强化后的值：
 * - 整数属性（hp/atk/def/spd）：按倍率放大，但保证每星至少 +1（避免低基础值被取整吞掉，强化肉眼可见）；
 *   高基础值仍走倍率，5 星最高 2 倍。
 * - 百分比属性（critRate/critDmg）：按倍率放大，保留 2 位小数。
 */
export function enhancedStatValue(key: keyof Stats, base: number, star: number): number {
  const s = star || 0
  if (key === 'critRate' || key === 'critDmg') {
    return Math.round(base * (1 + s * STAR_BONUS_PER_STAR) * 100) / 100
  }
  const byMult = base * (1 + s * STAR_BONUS_PER_STAR)
  const byFloor = base + s // 保底：每星至少 +1
  return Math.floor(Math.max(byMult, byFloor))
}

/** 强化到下一星所需的强化石 = 当前星数 + 1 */
export function enhanceCost(currentStar: number): number {
  return currentStar + 1
}

/** 装备经强化后的实际属性（用于展示） */
export function effectiveStats(eq: Equipment): Partial<Stats> {
  const out: Partial<Stats> = {}
  for (const k in eq.stats) {
    const key = k as keyof Stats
    out[key] = enhancedStatValue(key, eq.stats[key] ?? 0, eq.star)
  }
  return out
}

/** 分解装备所得强化石 = 品阶基础值 + 已投入星数 */
const GRADE_DECOMPOSE: Record<EquipGrade, number> = {
  white: 1,
  green: 2,
  blue: 4,
  purple: 7
}
export function decomposeValue(eq: Equipment): number {
  return GRADE_DECOMPOSE[eq.grade] + (eq.star || 0)
}

/** 击败敌人后掉落的强化石数量 */
export function rollStones(enemy: Enemy): number {
  if (enemy.dropRate >= 0.9) return 3 + Math.floor(Math.random() * 3) // BOSS 必掉 3-5
  if (Math.random() > 0.35) return 0
  return 1 + Math.floor(Math.random() * 2) // 普通怪 35% 掉 1-2
}

/** 击败敌人后掉落的银两 */
export function rollSilver(enemy: Enemy): number {
  if (enemy.dropRate >= 0.9) return 30 + Math.floor(Math.random() * 21) // BOSS 30-50
  return 5 + Math.floor(Math.random() * 6) // 普通 5-10
}
