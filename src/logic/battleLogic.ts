import type {
  Stats,
  SkillDef,
  Enemy,
  BattleResult,
  BattleLine,
  BattleFighter,
  BattleAction,
  WeaponType
} from '@/types/game'

const MAX_ROUNDS = 30
export { MAX_ROUNDS }

export interface AllyInput {
  name: string
  stats: Stats
  skill: SkillDef | null
  weaponType: WeaponType
  pos: number
}

/** 武器/招式类型 -> 中文名 */
export const WEAPON_TYPE_LABEL: Record<WeaponType, string> = {
  sword: '剑',
  saber: '刀',
  staff: '棍',
  whip: '鞭',
  fist: '拳掌'
}

/** 武器/招式类型 -> 攻击形状描述 */
export const WEAPON_TYPE_SHAPE: Record<WeaponType, string> = {
  sword: '纵线',
  saber: '斜线',
  staff: '横线',
  whip: '全体',
  fist: '单体'
}

interface Fighter {
  name: string
  stats: Stats
  hp: number
  isPlayer: boolean
  skill: SkillDef | null
}

/**
 * 计算某武器以 targetCell 为主目标时，命中九宫格的哪些格子（0-8）。
 * - 剑 sword: 纵线，主目标所在列（3 格）
 * - 棍 staff: 横线，主目标所在行（3 格）
 * - 刀 saber: 斜线，过主目标的最长对角线（2~3 格）
 * - 鞭 whip: 全体（9 格）
 * - 拳掌 fist: 单体（1 格）
 */
export function attackPatternCells(weapon: WeaponType, targetCell: number): number[] {
  const r = Math.floor(targetCell / 3)
  const c = targetCell % 3
  switch (weapon) {
    case 'fist':
      return [targetCell]
    case 'sword': // 纵线（列）：c, 3+c, 6+c
      return [c, 3 + c, 6 + c]
    case 'staff': // 横线（行）：r*3 .. r*3+2
      return [r * 3, r * 3 + 1, r * 3 + 2]
    case 'whip': // 全体
      return [0, 1, 2, 3, 4, 5, 6, 7, 8]
    case 'saber': {
      // 斜线：取过主目标的 \ 对角线(r-c 常量)与 / 对角线(r+c 常量)中较长者
      const back: number[] = [] // r-c 常量
      const fwd: number[] = [] // r+c 常量
      for (let k = 0; k < 9; k++) {
        const kr = Math.floor(k / 3)
        const kc = k % 3
        if (kr - kc === r - c) back.push(k)
        if (kr + kc === r + c) fwd.push(k)
      }
      return back.length >= fwd.length ? back : fwd
    }
  }
}

/** 计算一次攻击伤害（含暴击判定） */
export function calcDamage(
  attacker: Stats,
  target: Stats,
  multiplier: number
): { dmg: number; crit: boolean } {
  const crit = Math.random() < attacker.critRate
  const baseDmg = Math.max(attacker.atk - target.def, 1)
  const dmg = Math.floor(baseDmg * multiplier * (crit ? attacker.critDmg : 1))
  return { dmg, crit }
}

let fighterIdCounter = 0
export function makeFighter(input: AllyInput, isPlayer: boolean): BattleFighter {
  fighterIdCounter++
  return {
    id: `f-${fighterIdCounter}`,
    name: input.name,
    stats: input.stats,
    hp: input.stats.hp,
    maxHp: input.stats.hp,
    isPlayer,
    skill: input.skill,
    skillCd: 0,
    pos: input.pos,
    weaponType: input.weaponType
  }
}

export function makeEnemyFighter(enemy: Enemy, idx: number, pos: number): BattleFighter {
  return {
    id: `e-${enemy.id}-${idx}`,
    name: enemy.name,
    stats: enemy.stats,
    hp: enemy.stats.hp,
    maxHp: enemy.stats.hp,
    isPlayer: false,
    skill: null,
    skillCd: 0,
    pos,
    weaponType: enemy.weaponType
  }
}

/** 敌人 AI：随机选活着的目标格，技能可用时概率放 */
export function aiPickAction(
  self: BattleFighter,
  targets: BattleFighter[]
): { action: BattleAction; cell: number } {
  const alive = targets.filter((t) => t.hp > 0)
  if (alive.length === 0) return { action: 'attack', cell: -1 }
  const pick = alive[Math.floor(Math.random() * alive.length)]
  const action: BattleAction =
    self.skill && self.skillCd <= 0 && Math.random() < 0.5 ? 'skill' : 'attack'
  return { action, cell: pick.pos }
}

/**
 * 自动回合制战斗（保留用于以后"扫荡"；当前挑战用手动战斗）
 */
export function runBattle(allies: AllyInput[], enemies: Enemy[]): BattleResult {
  const allyFighters: Fighter[] = allies.map((a) => ({
    name: a.name,
    stats: a.stats,
    hp: a.stats.hp,
    isPlayer: true,
    skill: a.skill
  }))
  const foes: Fighter[] = enemies.map((e) => ({
    name: e.name,
    stats: e.stats,
    hp: e.stats.hp,
    isPlayer: false,
    skill: null
  }))
  const log: BattleLine[] = []

  let round = 0
  while (round < MAX_ROUNDS) {
    round++
    const order = [...allyFighters, ...foes]
      .filter((f) => f.hp > 0)
      .sort((a, b) => b.stats.spd - a.stats.spd)
    for (const f of order) {
      if (f.hp <= 0) continue
      const targets = f.isPlayer ? foes : allyFighters
      const alive = targets.filter((t) => t.hp > 0)
      if (alive.length === 0) break
      const target = alive[0]

      let multiplier = 1
      let skillName: string | undefined
      if (f.skill && round % f.skill.trigger.n === 0) {
        multiplier = f.skill.multiplier
        skillName = f.skill.name
      }

      const { dmg, crit } = calcDamage(f.stats, target.stats, multiplier)
      target.hp -= dmg
      log.push({ round, attacker: f.name, target: target.name, dmg, crit, skillName })

      if (allyFighters.every((a) => a.hp <= 0) || foes.every((fo) => fo.hp <= 0)) break
    }
    if (allyFighters.every((a) => a.hp <= 0) || foes.every((fo) => fo.hp <= 0)) break
  }

  const win = allyFighters.some((a) => a.hp > 0) && foes.every((fo) => fo.hp <= 0)
  const expGained = win ? enemies.reduce((s, e) => s + e.expReward, 0) : 0
  return {
    win,
    rounds: round,
    log,
    expGained,
    drops: [],
    acquiredHeroes: [],
    stonesGained: 0,
    silverGained: 0,
    acquiredInnerSkills: []
  }
}
