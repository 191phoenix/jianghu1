import type { Stats, SkillDef, Enemy, BattleResult, BattleLine } from '@/types/game'

interface Fighter {
  name: string
  stats: Stats
  hp: number
  isPlayer: boolean
}

const MAX_ROUNDS = 30

/**
 * 自动回合制战斗
 * 玩家单角色 vs 敌人小队；每回合按速度排序行动，普攻为主，
 * 玩家技能按 every-n-rounds 触发，造成 multiplier 倍伤害。
 */
export function runBattle(
  playerStats: Stats,
  playerName: string,
  skill: SkillDef | null,
  enemies: Enemy[]
): BattleResult {
  const player: Fighter = {
    name: playerName,
    stats: playerStats,
    hp: playerStats.hp,
    isPlayer: true
  }
  const foes: Fighter[] = enemies.map((e) => ({
    name: e.name,
    stats: e.stats,
    hp: e.stats.hp,
    isPlayer: false
  }))
  const log: BattleLine[] = []

  let round = 0
  while (round < MAX_ROUNDS) {
    round++
    const order = [player, ...foes]
      .filter((f) => f.hp > 0)
      .sort((a, b) => b.stats.spd - a.stats.spd)
    for (const f of order) {
      if (f.hp <= 0) continue
      const targets = f.isPlayer ? foes : [player]
      const alive = targets.filter((t) => t.hp > 0)
      if (alive.length === 0) break
      const target = alive[0]

      let multiplier = 1
      let skillName: string | undefined
      if (f.isPlayer && skill && round % skill.trigger.n === 0) {
        multiplier = skill.multiplier
        skillName = skill.name
      }

      const crit = Math.random() < f.stats.critRate
      const baseDmg = Math.max(f.stats.atk - target.stats.def, 1)
      const dmg = Math.floor(baseDmg * multiplier * (crit ? f.stats.critDmg : 1))
      target.hp -= dmg
      log.push({ round, attacker: f.name, target: target.name, dmg, crit, skillName })

      if (player.hp <= 0 || foes.every((fo) => fo.hp <= 0)) break
    }
    if (player.hp <= 0 || foes.every((fo) => fo.hp <= 0)) break
  }

  const win = player.hp > 0 && foes.every((fo) => fo.hp <= 0)
  const expGained = win ? enemies.reduce((s, e) => s + e.expReward, 0) : 0
  return { win, rounds: round, log, expGained, drops: [] }
}
