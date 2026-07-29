import type { LevelDef, Enemy, Stats } from '@/types/game'

/** 按关卡序号生成敌人，属性线性递增；BOSS 关属性翻倍 */
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
    dropRate: isBoss ? 0.95 : 0.22
  }
}

const MOB_NAMES = ['山贼', '流寇', '野狼', '毒蛇', '山魈', '恶丐', '黑衣人', '山贼头目', '江湖恶客']

/** 第一章：10 关 + 末关 BOSS */
export const LEVELS: LevelDef[] = Array.from({ length: 10 }, (_, i) => {
  const idx = i + 1
  const isBoss = idx === 10
  const name = isBoss ? '黑风寨主' : MOB_NAMES[i % MOB_NAMES.length]
  return {
    id: `1-${idx}`,
    chapter: 1,
    index: idx,
    name: `第一章 第${idx}关`,
    enemies: [makeEnemy(`e1-${idx}`, name, idx, isBoss)],
    isBoss
  }
})

export const FIRST_LEVEL_ID = '1-1'

export function getLevel(id: string): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id)
}

export function nextLevelId(id: string): string | null {
  const i = LEVELS.findIndex((l) => l.id === id)
  if (i < 0 || i >= LEVELS.length - 1) return null
  return LEVELS[i + 1].id
}
