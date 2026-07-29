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
