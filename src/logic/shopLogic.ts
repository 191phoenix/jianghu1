import type { Player, Equipment } from '@/types/game'
import { rollEquipment, randomDropGrade, ALL_SLOTS } from '@/config/equipmentConfig'
import { SHOP_SLOT_COUNT } from '@/config/shopConfig'
import { maxClearedLevel } from './levelLogic'
import { genId } from '@/utils/id'

/** 按玩家最高已通关卡进度生成商店装备摊 */
export function rollShopItems(player: Player): Equipment[] {
  const maxLevel = maxClearedLevel(player.clearedLevelIds)
  const levelIdx = maxLevel ? (maxLevel.chapter - 1) * 10 + maxLevel.index : 1
  const items: Equipment[] = []
  for (let i = 0; i < SHOP_SLOT_COUNT; i++) {
    const slot = ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)]
    const grade = randomDropGrade(levelIdx)
    items.push(rollEquipment(slot, grade, genId('shop')))
  }
  return items
}
