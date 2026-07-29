import type { Stats, SkillDef, Enemy, BattleResult, BattleLine } from '@/types/game'

interface Fighter {
  name: string
  stats: Stats
  hp: number
  isPlayer: boolean
  skill: SkillDef | null
}

const MAX_ROUNDS = 30

export interface AllyInput {
  name: string
  stats: Stats
  skill: SkillDef | null
}

/**
 * 自动回合制战斗（阶段 2：多角色 vs 多敌人）
 * 玩家方 = 主角 + 上阵侠客；每回合按速度排序行动，
 * 各自的技能按 every-n-rounds 触发，造成 multiplier 倍伤害。
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

      const crit = Math.random() < f.stats.critRate
      const baseDmg = Math.max(f.stats.atk - target.stats.def, 1)
      const dmg = Math.floor(baseDmg * multiplier * (crit ? f.stats.critDmg : 1))
      target.hp -= dmg
      log.push({ round, attacker: f.name, target: target.name, dmg, crit, skillName })

      if (allyFighters.every((a) => a.hp <= 0) || foes.every((fo) => fo.hp <= 0)) break
    }
    if (allyFighters.every((a) => a.hp <= 0) || foes.every((fo) => fo.hp <= 0)) break
  }

  const win = allyFighters.some((a) => a.hp > 0) && foes.every((fo) => fo.hp <= 0)
  const expGained = win ? enemies.reduce((s, e) => s + e.expReward, 0) : 0
  return { win, rounds: round, log, expGained, drops: [], acquiredHeroes: [] }
}
