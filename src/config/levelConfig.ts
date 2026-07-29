import type { LevelDef, Enemy, Stats, WeaponType } from '@/types/game'
import { genId } from '@/utils/id'

/** 普通怪武器类型轮换；BOSS 用鞭(全体)以让站位有意义 */
const MOB_WEAPONS: WeaponType[] = ['sword', 'saber', 'staff', 'fist']

/** 按全局序号生成敌人，属性线性递增；BOSS 关属性翻倍 */
function makeEnemy(id: string, name: string, idx: number, isBoss: boolean): Enemy {
  const k = isBoss ? 2.2 : 1
  const stats: Stats = {
    hp: Math.floor((55 + idx * 22) * k),
    atk: Math.floor((7 + idx * 2.4) * k),
    def: Math.floor((2 + idx * 1.1) * k),
    spd: 8 + idx,
    critRate: 0.03,
    critDmg: 1.3
  }
  return {
    id,
    name,
    stats,
    expReward: Math.floor((18 + idx * 8) * k),
    dropRate: isBoss ? 0.95 : 0.22,
    weaponType: isBoss ? 'whip' : MOB_WEAPONS[idx % MOB_WEAPONS.length]
  }
}

const MOB1 = ['山贼', '流寇', '野狼', '毒蛇', '山魈', '恶丐', '黑衣人', '山贼头目', '江湖恶客']
const MOB2 = ['黑衣杀手', '毒蛊', '瘴鬼', '蛮兵', '邪道人', '飞贼', '魔教徒', '独眼悍匪']

/** 生成路径节点上的敌人（按关卡难度缩放；精英怪强化） */
export function makePathEnemy(levelIdx: number, elite: boolean, chapter: number): Enemy {
  const pool = chapter === 1 ? MOB1 : MOB2
  const name = pool[Math.floor(Math.random() * pool.length)]
  const e = makeEnemy(genId('pe'), name, levelIdx, false)
  if (elite) {
    e.stats = {
      ...e.stats,
      hp: Math.floor(e.stats.hp * 1.6),
      atk: Math.floor(e.stats.atk * 1.4),
      def: Math.floor(e.stats.def * 1.3)
    }
    e.expReward = Math.floor(e.expReward * 1.5)
    e.dropRate = 0.4
  }
  return e
}

/** 第一章：10 关 + 末关 BOSS */
const CHAPTER1: LevelDef[] = Array.from({ length: 10 }, (_, i) => {
  const idx = i + 1
  const isBoss = idx === 10
  const name = isBoss ? '黑风寨主' : MOB1[i % MOB1.length]
  return {
    id: `1-${idx}`,
    chapter: 1,
    index: idx,
    name: `第一章 第${idx}关`,
    enemies: [makeEnemy(`e1-${idx}`, name, idx, isBoss)],
    isBoss
  }
})

/** 第二章：10 关 + 末关 BOSS，部分关多敌人 */
const CHAPTER2: LevelDef[] = Array.from({ length: 10 }, (_, i) => {
  const idx = 10 + i + 1 // 全局序号 11-20
  const isBoss = i === 9
  const count = !isBoss && (i + 1) % 3 === 0 ? 2 : 1
  const baseName = isBoss ? '魔教长老' : MOB2[i % MOB2.length]
  const enemies = Array.from({ length: count }, (_, j) =>
    makeEnemy(`e2-${idx}-${j}`, count > 1 ? `${baseName}·${j + 1}` : baseName, idx, isBoss)
  )
  return {
    id: `2-${i + 1}`,
    chapter: 2,
    index: i + 1,
    name: `第二章 第${i + 1}关`,
    enemies,
    isBoss
  }
})

export const LEVELS: LevelDef[] = [...CHAPTER1, ...CHAPTER2]

export const FIRST_LEVEL_ID = '1-1'

export function getLevel(id: string): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id)
}

export function nextLevelId(id: string): string | null {
  const i = LEVELS.findIndex((l) => l.id === id)
  if (i < 0 || i >= LEVELS.length - 1) return null
  return LEVELS[i + 1].id
}
