import type { Enemy, Equipment, EquipSlot } from '@/types/game'
import { rollEquipment, randomDropGrade } from '@/config/equipmentConfig'
import { genId } from '@/utils/id'

const SLOTS: EquipSlot[] = ['weapon', 'armor', 'accessory']

/** 击败敌人后按掉率掷骰生成装备 */
export function rollDrop(enemy: Enemy, levelIdx: number): Equipment | null {
  if (Math.random() > enemy.dropRate) return null
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)]
  const grade = randomDropGrade(levelIdx)
  return rollEquipment(slot, grade, genId('eq'))
}
