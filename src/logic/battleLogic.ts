import type {
  Stats,
  SkillDef,
  Enemy,
  BattleResult,
  BattleLine,
  BattleFighter,
  BattleAction
} from '@/types/game'

const MAX_ROUNDS = 30
export { MAX_ROUNDS }

export interface AllyInput {
  name: string
  stats: Stats
  skill: SkillDef | null
}

interface Fighter {
  name: string
  stats: Stats
  hp: number
  isPlayer: boolean
  skill: SkillDef | null
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
    skillCd: 0
  }
}

export function makeEnemyFighter(enemy: Enemy, idx: number): BattleFighter {
  return {
    id: `e-${enemy.id}-${idx}`,
    name: enemy.name,
    stats: enemy.stats,
    hp: enemy.stats.hp,
    maxHp: enemy.stats.hp,
    isPlayer: false,
    skill: null,
    skillCd: 0
  }
}

/** 敌人 AI：随机选活着的目标，技能可用时概率放 */
export function aiPickAction(
  self: BattleFighter,
  targets: BattleFighter[]
): { action: BattleAction; targetIdx: number } {
  const alive = targets
    .map((t, i) => ({ t, i }))
    .filter((x) => x.t.hp > 0)
  if (alive.length === 0) return { action: 'attack', targetIdx: 0 }
  const pick = alive[Math.floor(Math.random() * alive.length)]
  const action: BattleAction =
    self.skill && self.skillCd <= 0 && Math.random() < 0.5 ? 'skill' : 'attack'
  return { action, targetIdx: pick.i }
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
