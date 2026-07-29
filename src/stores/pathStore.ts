import { defineStore } from 'pinia'
import type { PathRun, PathNode, LevelDef } from '@/types/game'
import { generatePath } from '@/logic/pathLogic'

export const usePathStore = defineStore('path', {
  state: () => ({
    run: null as PathRun | null
  }),
  getters: {
    active(state): boolean {
      return !!state.run
    },
    current(state): PathNode | null {
      return state.run ? state.run.nodes[state.run.idx] ?? null : null
    },
    isCleared(state): boolean {
      return !!state.run && state.run.status === 'cleared'
    }
  },
  actions: {
    /** 进入某关，随机生成路径 */
    startPath(level: LevelDef) {
      this.run = {
        levelId: level.id,
        nodes: generatePath(level),
        idx: 0,
        status: 'ongoing',
        log: [`进入「${level.name}」`]
      }
    },
    /** 非战斗节点解决：标记 resolved，idx++，写日志 */
    advanceNonBattle(logMsg?: string) {
      const r = this.run
      if (!r) return
      const node = r.nodes[r.idx]
      if (node) {
        node.resolved = true
        if (logMsg) r.log.push(logMsg)
      }
      r.idx++
    },
    /** 战斗节点胜利：标记 resolved，idx++；关主则通关 */
    onBattleWin(logMsg?: string) {
      const r = this.run
      if (!r) return
      const node = r.nodes[r.idx]
      if (node) {
        node.resolved = true
        if (logMsg) r.log.push(logMsg)
        if (node.type === 'boss') {
          r.status = 'cleared'
          r.log.push('击败关主，通关！')
        }
      }
      r.idx++
    },
    pushLog(msg: string) {
      if (this.run) this.run.log.push(msg)
    },
    exit() {
      this.run = null
    }
  }
})
