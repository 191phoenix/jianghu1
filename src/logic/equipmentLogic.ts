import type { Enemy, Equipment } from '@/types/game'
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

/** 强化到下一星所需的强化石 = 当前星数 + 1 */
export function enhanceCost(currentStar: number): number {
  return currentStar + 1
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
