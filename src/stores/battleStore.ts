import { defineStore } from 'pinia'
import type {
  BattleState,
  BattleFighter,
  BattleAction,
  BattleLine,
  Enemy
} from '@/types/game'
import {
  calcDamage,
  makeFighter,
  makeEnemyFighter,
  aiPickAction,
  attackPatternCells,
  MAX_ROUNDS,
  type AllyInput
} from '@/logic/battleLogic'

/** 敌人自动落位顺序：前排优先（6,7,8 为前排，靠我方） */
const ENEMY_POS_ORDER = [6, 7, 8, 3, 4, 5, 0, 1, 2]

export const useBattleStore = defineStore('battle', {
  state: () => ({
    battle: null as BattleState | null
  }),
  getters: {
    /** 当前行动者 */
    active(state): BattleFighter | null {
      if (!state.battle || state.battle.phase === 'ended' || state.battle.phase === 'setup') return null
      const id = state.battle.order[state.battle.actorIdx]
      if (!id) return null
      return [...state.battle.allies, ...state.battle.enemies].find((f) => f.id === id) ?? null
    }
  },
  actions: {
    /** 进入布阵阶段：构造敌人（自动站位）+ 我方默认站位 */
    initSetup(levelId: string, enemies: Enemy[], setupChosen: string[], setupGrid: (string | null)[]) {
      const enemyF = enemies.map((e, i) => makeEnemyFighter(e, i, ENEMY_POS_ORDER[i] ?? 0))
      this.battle = {
        levelId,
        allies: [],
        enemies: enemyF,
        round: 1,
        actorIdx: 0,
        order: [],
        phase: 'setup',
        log: [],
        result: null,
        pendingAction: null,
        setupChosen: [...setupChosen],
        setupGrid: [...setupGrid],
        pendingTargetCell: null
      }
    },

    /** 布阵完成，进入战斗：构造我方 fighters 并按速度排序开打 */
    startCombat(allies: AllyInput[]) {
      const b = this.battle
      if (!b) return
      const allyF = allies.map((a) => makeFighter(a, true))
      b.allies = allyF
      const all = [...allyF, ...b.enemies]
      b.order = all.sort((x, y) => y.stats.spd - x.stats.spd).map((f) => f.id)
      b.actorIdx = 0
      b.round = 1
      const first = all.find((f) => f.id === b.order[0])!
      b.phase = first.isPlayer ? 'player' : 'enemy'
      if (!first.isPlayer) this.enemyTurn()
    },

    /** 布阵：加入/移除一名侠客（≤2，不含主角） */
    setupToggleHero(heroId: string) {
      const b = this.battle
      if (!b || b.phase !== 'setup') return
      const i = b.setupChosen.indexOf(heroId)
      if (i >= 0) {
        b.setupChosen.splice(i, 1)
        const cell = b.setupGrid.indexOf(heroId)
        if (cell >= 0) b.setupGrid[cell] = null
      } else {
        if (b.setupChosen.length >= 2) return
        b.setupChosen.push(heroId)
      }
    },

    /** 布阵：把 main/侠客 放到指定格（自动从旧格移除；目标格原占者被顶替回候选） */
    setupPlace(key: string, cell: number) {
      const b = this.battle
      if (!b || b.phase !== 'setup') return
      if (cell < 0 || cell > 8) return
      if (key !== 'main' && !b.setupChosen.includes(key)) return
      const old = b.setupGrid.indexOf(key)
      if (old >= 0) b.setupGrid[old] = null
      b.setupGrid[cell] = key
    },

    /** 布阵：清空一格 */
    setupClearCell(cell: number) {
      const b = this.battle
      if (!b || b.phase !== 'setup') return
      if (cell < 0 || cell > 8) return
      b.setupGrid[cell] = null
    },

    findFighter(id: string): BattleFighter | undefined {
      if (!this.battle) return undefined
      return [...this.battle.allies, ...this.battle.enemies].find((f) => f.id === id)
    },

    /** 玩家选行动类型（普攻/技能），进入选目标 */
    playerChooseAction(action: BattleAction) {
      if (this.battle) this.battle.pendingAction = action
    },

    /** 玩家选目标格，执行行动 */
    playerChooseTargetCell(cell: number) {
      const b = this.battle
      if (!b || !b.pendingAction) return
      const action = b.pendingAction
      b.pendingAction = null
      b.pendingTargetCell = null
      this.performActionOnCell(action, cell)
    },

    cancelAction() {
      if (this.battle) {
        this.battle.pendingAction = null
        this.battle.pendingTargetCell = null
      }
    },

    /** 执行一次行动：按武器形状对目标格及关联格造成伤害 */
    performActionOnCell(action: BattleAction, cell: number) {
      const b = this.battle!
      const actor = this.active!
      const targets = actor.isPlayer ? b.enemies : b.allies
      const primary = targets.find((t) => t.pos === cell && t.hp > 0)
      if (!primary) return

      let multiplier = 1
      let skillName: string | undefined
      if (action === 'skill' && actor.skill && actor.skillCd <= 0) {
        multiplier = actor.skill.multiplier
        skillName = actor.skill.name
        actor.skillCd = actor.skill.trigger.n
      }

      const cells = attackPatternCells(actor.weaponType, cell)
      const hit = targets.filter((t) => t.hp > 0 && cells.includes(t.pos))
      for (const t of hit) {
        const { dmg, crit } = calcDamage(actor.stats, t.stats, multiplier)
        t.hp -= dmg
        const line: BattleLine = {
          round: b.round,
          attacker: actor.name,
          target: t.name,
          dmg,
          crit,
          skillName
        }
        b.log.push(line)
      }

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
      const { action, cell } = aiPickAction(actor, b.allies)
      if (cell < 0) {
        this.afterAction()
        return
      }
      this.performActionOnCell(action, cell)
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
