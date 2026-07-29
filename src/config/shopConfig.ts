import type { EquipGrade } from '@/types/game'

/** 装备售价（按品阶） */
export const EQUIP_PRICE: Record<EquipGrade, number> = {
  white: 50,
  green: 120,
  blue: 250,
  purple: 500
}

export const STONE_PRICE = 50 // 1 颗强化石
export const REFRESH_PRICE = 100 // 刷新装备摊
export const SHOP_SLOT_COUNT = 3
