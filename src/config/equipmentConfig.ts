import type { EquipSlot, EquipGrade, Stats, Equipment, WeaponType } from '@/types/game'

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

/** 非武器部位的名称 */
const SLOT_NAMES: Partial<Record<EquipSlot, Record<EquipGrade, string>>> = {
  armor: { white: '布衣', green: '皮甲', blue: '玄铁甲', purple: '天蚕宝衣' },
  head: { white: '布巾', green: '皮帽', blue: '铁盔', purple: '金冠' },
  foot: { white: '草鞋', green: '皮靴', blue: '战靴', purple: '踏云靴' },
  accessory: { white: '木珠', green: '玉佩', blue: '血玉', purple: '龙纹佩' },
  neck: { white: '木链', green: '玉链', blue: '血珀', purple: '龙魂链' }
}

/** 非武器部位的主属性与基础值 */
const SLOT_BASE: Partial<Record<EquipSlot, Partial<Stats>>> = {
  armor: { hp: 30, def: 3 },
  head: { hp: 20, def: 2 },
  foot: { spd: 3, def: 1 },
  accessory: { critRate: 0.03, critDmg: 0.1, spd: 2 },
  neck: { critRate: 0.02, critDmg: 0.08, atk: 2 }
}

/** 武器类型目录（决定名称与属性倾向，不影响九宫格攻击形状） */
export const WEAPON_TYPES: WeaponType[] = ['sword', 'saber', 'staff', 'whip', 'fist']

const WEAPON_NAMES: Record<WeaponType, Record<EquipGrade, string>> = {
  sword: { white: '木剑', green: '铁剑', blue: '寒霜剑', purple: '紫电剑' },
  saber: { white: '木刀', green: '朴刀', blue: '断水刀', purple: '烈焰刀' },
  staff: { white: '木棍', green: '铁棍', blue: '降魔棍', purple: '盘龙棍' },
  whip: { white: '短鞭', green: '皮鞭', blue: '毒蛟鞭', purple: '九节鞭' },
  fist: { white: '铁指环', green: '铁掌套', blue: '金刚套', purple: '裂空爪' }
}

/** 各武器类型的基础属性倾向 */
const WEAPON_BASE: Record<WeaponType, Partial<Stats>> = {
  sword: { atk: 5 }, // 均衡
  saber: { atk: 6 }, // 高攻重器
  staff: { atk: 4, def: 1 }, // 攻守兼备
  whip: { atk: 3, spd: 2 }, // 轻灵迅捷
  fist: { atk: 4, critRate: 0.02 } // 暴击取向
}

export const ALL_SLOTS: EquipSlot[] = ['weapon', 'armor', 'head', 'foot', 'accessory', 'neck']

/** 生成一件装备；武器部位可指定 weaponType，缺省随机 */
export function rollEquipment(
  slot: EquipSlot,
  grade: EquipGrade,
  id: string,
  weaponType?: WeaponType
): Equipment {
  const mult = GRADE_MULT[grade]
  let base: Partial<Stats>
  let name: string
  let wt: WeaponType | undefined
  if (slot === 'weapon') {
    wt = weaponType ?? WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)]
    base = WEAPON_BASE[wt]
    name = WEAPON_NAMES[wt][grade]
  } else {
    base = SLOT_BASE[slot]!
    name = SLOT_NAMES[slot]![grade]
  }
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
  return { id, name, slot, grade, stats, star: 0, ...(wt ? { weaponType: wt } : {}) }
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
