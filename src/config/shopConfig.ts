import type { EquipGrade, ShopGearDef } from '@/types/game'

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

/** 招牌装备：固定目录，每件仅可购买一次 */
export const SHOP_GEAR: ShopGearDef[] = [
  { id: 'sg-qingfeng', name: '青锋剑', slot: 'weapon', grade: 'green', stats: { atk: 8 }, price: 150, weaponType: 'sword' },
  { id: 'sg-xuantie', name: '玄铁重剑', slot: 'weapon', grade: 'blue', stats: { atk: 16 }, price: 450, weaponType: 'sword' },
  { id: 'sg-jinsi', name: '金丝软甲', slot: 'armor', grade: 'blue', stats: { hp: 70, def: 6 }, price: 480 },
  { id: 'sg-jinfeng', name: '疾风靴', slot: 'foot', grade: 'green', stats: { spd: 5, def: 1 }, price: 140 },
  { id: 'sg-yupei', name: '寒玉佩', slot: 'accessory', grade: 'green', stats: { critRate: 0.05, spd: 2 }, price: 160 },
  { id: 'sg-xueyu', name: '血玉', slot: 'accessory', grade: 'blue', stats: { critRate: 0.08, critDmg: 0.15 }, price: 420 },
  { id: 'sg-jinguan', name: '紫金冠', slot: 'head', grade: 'blue', stats: { hp: 45, def: 5 }, price: 380 },
  { id: 'sg-longhun', name: '龙魂链', slot: 'neck', grade: 'purple', stats: { atk: 7, critRate: 0.07, critDmg: 0.2 }, price: 900 }
]

