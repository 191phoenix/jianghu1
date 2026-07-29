import { defineStore } from 'pinia'
import type {
  BattleState,
  BattleFighter,
  BattleAction,
  BattleLine
} from '@/types/game'
import type { Enemy } from '@/types/game'
import { calcDamage, makeFighter, makeEnemyFighter, aiPickAction, MAX_ROUNDS, type AllyInput } from '@/logic/battleLogic'

export const useBattleStore = defineStore('battle', {
  state: () => ({
    battle: null as BattleState | null
  }),
  getters: {
    /** 当前行动者 */
    active(state): BattleFighter | null {
      if (!state.battle || state.battle.phase === 'ended') return null
      const id = state.battle.order[state.battle.actorIdx]
      if (!id) return null
      return [...state.battle.allies, ...state.battle.enemies].find((f) => f.id === id) ?? null
    }
  },
  actions: {
    /** 初始化一场战斗 */
    initBattle(levelId: string, allies: AllyInput[], enemies: Enemy[]) {
      const allyF = allies.map((a) => makeFighter(a, true))
      const enemyF = enemies.map((e, i) => makeEnemyFighter(e, i))
      const order = [...allyF, ...enemyF]
        .sort((a, b) => b.stats.spd - a.stats.spd)
        .map((f) => f.id)
      const first = [...allyF, ...enemyF].find((f) => f.id === order[0])!
      this.battle = {
        levelId,
        allies: allyF,
        enemies: enemyF,
        round: 1,
        actorIdx: 0,
        order,
        phase: first.isPlayer ? 'player' : 'enemy',
        log: [],
        result: null,
        pendingAction: null
      }
      if (!first.isPlayer) this.enemyTurn()
    },

    findFighter(id: string): BattleFighter | undefined {
      if (!this.battle) return undefined
      return [...this.battle.allies, ...this.battle.enemies].find((f) => f.id === id)
    },

    /** 玩家选行动类型（普攻/技能），进入选目标 */
    playerChooseAction(action: BattleAction) {
      if (this.battle) this.battle.pendingAction = action
    },

    /** 玩家选目标，执行行动 */
    playerChooseTarget(targetIdx: number) {
      if (!this.battle || !this.battle.pendingAction) return
      const action = this.battle.pendingAction
      this.battle.pendingAction = null
      this.performAction(action, targetIdx)
    },

    cancelAction() {
      if (this.battle) this.battle.pendingAction = null
    },

    /** 执行一次行动 */
    performAction(action: BattleAction, targetIdx: number) {
      const b = this.battle!
      const actor = this.active!
      const targets = actor.isPlayer ? b.enemies : b.allies
      const target = targets[targetIdx]
      if (!target || target.hp <= 0) return

      let multiplier = 1
      let skillName: string | undefined
      if (action === 'skill' && actor.skill && actor.skillCd <= 0) {
        multiplier = actor.skill.multiplier
        skillName = actor.skill.name
        actor.skillCd = actor.skill.trigger.n
      }

      const { dmg, crit } = calcDamage(actor.stats, target.stats, multiplier)
      target.hp -= dmg
      const line: BattleLine = {
        round: b.round,
        attacker: actor.name,
        target: target.name,
        dmg,
        crit,
        skillName
      }
      b.log.push(line)

      // 非技能行动递减技能 CD
      if (action !== 'skill' && actor.skillCd > 0) actor.skillCd--

      this.afterAction()
    },

    afterAction() {
      const b = this.battle!
      if (b.allies.every((a) => a.hp <= 0) || b.enemies.every((e) => e.hp <= 0)) {
        this.endBattle()
        return
      }
      this.nextActor()
    },

    nextActor() {
      const b = this.battle!
      b.actorIdx++
      // 跳过死亡
      while (b.actorIdx < b.order.length) {
        const f = this.findFighter(b.order[b.actorIdx])
        if (f && f.hp > 0) break
        b.actorIdx++
      }
      if (b.actorIdx >= b.order.length) {
        // 本轮结束，进入下一轮
        b.round++
        if (b.round > MAX_ROUNDS) {
          this.endBattle()
          return
        }
        b.order = [...b.allies, ...b.enemies]
          .filter((f) => f.hp > 0)
          .sort((a, c) => c.stats.spd - a.stats.spd)
          .map((f) => f.id)
        b.actorIdx = 0
        if (b.order.length === 0) {
          this.endBattle()
          return
        }
      }
      const f = this.findFighter(b.order[b.actorIdx])!
      if (f.isPlayer) {
        b.phase = 'player'
      } else {
        b.phase = 'enemy'
        this.enemyTurn()
      }
    },

    /** 敌人 AI 行动 */
    enemyTurn() {
      const b = this.battle!
      const actor = this.active!
      const { action, targetIdx } = aiPickAction(actor, b.allies)
      this.performAction(action, targetIdx)
    },

    endBattle() {
      const b = this.battle!
      b.phase = 'ended'
      const win = b.allies.some((a) => a.hp > 0) && b.enemies.every((e) => e.hp <= 0)
      b.result = {
        win,
        rounds: b.round,
        log: b.log,
        expGained: 0,
        drops: [],
        acquiredHeroes: [],
        stonesGained: 0,
        silverGained: 0,
        acquiredInnerSkills: []
      }
    },

    reset() {
      this.battle = null
    }
  }
})
