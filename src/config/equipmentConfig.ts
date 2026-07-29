import type { EquipSlot, EquipGrade, Stats, Equipment } from '@/types/game'

export const GRADE_ORDER: EquipGrade[] = ['white', 'green', 'blue', 'purple']

export const GRADE_LABEL: Record<EquipGrade, string> = {
  white: '白',
  green: '绿',
  blue: '蓝',
  purple: '紫'
}

export const SLOT_LABEL: Record<EquipSlot, string> = {
  weapon: '武器',
  armor: '衣服',
  head: '帽子',
  foot: '鞋子',
  accessory: '饰品',
  neck: '项链'
}

const GRADE_MULT: Record<EquipGrade, number> = {
  white: 1,
  green: 1.6,
  blue: 2.4,
  purple: 3.5
}

const SLOT_NAMES: Record<EquipSlot, Record<EquipGrade, string>> = {
  weapon: { white: '木剑', green: '铁剑', blue: '寒霜剑', purple: '紫电剑' },
  armor: { white: '布衣', green: '皮甲', blue: '玄铁甲', purple: '天蚕宝衣' },
  head: { white: '布巾', green: '皮帽', blue: '铁盔', purple: '金冠' },
  foot: { white: '草鞋', green: '皮靴', blue: '战靴', purple: '踏云靴' },
  accessory: { white: '木珠', green: '玉佩', blue: '血玉', purple: '龙纹佩' },
  neck: { white: '木链', green: '玉链', blue: '血珀', purple: '龙魂链' }
}

/** 每个部位的主属性与基础值 */
const SLOT_BASE: Record<EquipSlot, Partial<Stats>> = {
  weapon: { atk: 5 },
  armor: { hp: 30, def: 3 },
  head: { hp: 20, def: 2 },
  foot: { spd: 3, def: 1 },
  accessory: { critRate: 0.03, critDmg: 0.1, spd: 2 },
  neck: { critRate: 0.02, critDmg: 0.08, atk: 2 }
}

export const ALL_SLOTS: EquipSlot[] = ['weapon', 'armor', 'head', 'foot', 'accessory', 'neck']

/** 生成一件装备 */
export function rollEquipment(slot: EquipSlot, grade: EquipGrade, id: string): Equipment {
  const mult = GRADE_MULT[grade]
  const base = SLOT_BASE[slot]
  const stats: Partial<Stats> = {}
  for (const k in base) {
    const key = k as keyof Stats
    const val = (base[key] as number) * mult
    if (key === 'critRate' || key === 'critDmg') {
      stats[key] = Math.round(val * 100) / 100
    } else {
      stats[key] = Math.floor(val)
    }
  }
  return { id, name: SLOT_NAMES[slot][grade], slot, grade, stats }
}

/** 按关卡难度随机品阶（关数越高，高级概率越大） */
export function randomDropGrade(levelIdx: number): EquipGrade {
  const purpleChance = Math.min(0.02 + levelIdx * 0.03, 0.25)
  const blueChance = Math.min(0.1 + levelIdx * 0.04, 0.4)
  const greenChance = Math.min(0.25 + levelIdx * 0.03, 0.5)
  const r = Math.random()
  if (r < purpleChance) return 'purple'
  if (r < purpleChance + blueChance) return 'blue'
  if (r < purpleChance + blueChance + greenChance) return 'green'
  return 'white'
}
