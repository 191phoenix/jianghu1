import { defineStore } from 'pinia'
import type { Player, BattleResult, Equipment, EquipSlot, OfflineReward, Sect } from '@/types/game'
import { DEFAULT_SECT, SECTS } from '@/config/sectConfig'
import { FIRST_LEVEL_ID, getLevel, nextLevelId } from '@/config/levelConfig'
import { computePlayerStats } from '@/logic/statsLogic'
import { runBattle } from '@/logic/battleLogic'
import { expToNext } from '@/logic/growthLogic'
import { rollDrop } from '@/logic/equipmentLogic'
import { settleOffline } from '@/logic/offlineLogic'

function defaultPlayer(): Player {
  return {
    name: '无名侠客',
    sect: DEFAULT_SECT,
    level: 1,
    exp: 0,
    equipped: { weapon: null, armor: null, accessory: null },
    bag: [],
    currentLevelId: FIRST_LEVEL_ID,
    clearedLevelIds: [],
    createdAt: 0,
    lastActiveTime: 0
  }
}

export const useGameStore = defineStore('game', {
  state: () => ({
    player: defaultPlayer(),
    lastSaveTime: 0,
    pendingOffline: null as OfflineReward | null
  }),
  getters: {
    sectInfo(state): Sect {
      return SECTS[state.player.sect] ?? SECTS[DEFAULT_SECT]
    }
  },
  actions: {
    /** 兼容旧存档：补全缺失字段（阶段 0 存档升级用） */
    normalize() {
      const d = defaultPlayer()
      const p = this.player as Partial<Player>
      this.player = {
        name: p.name ?? d.name,
        sect: p.sect && SECTS[p.sect] ? p.sect : d.sect,
        level: p.level ?? d.level,
        exp: p.exp ?? d.exp,
        equipped: {
          weapon: p.equipped?.weapon ?? null,
          armor: p.equipped?.armor ?? null,
          accessory: p.equipped?.accessory ?? null
        },
        bag: p.bag ?? d.bag,
        currentLevelId: p.currentLevelId ?? d.currentLevelId,
        clearedLevelIds: p.clearedLevelIds ?? d.clearedLevelIds,
        createdAt: p.createdAt || Date.now(),
        lastActiveTime: p.lastActiveTime || Date.now()
      }
    },

    setPlayerName(name: string) {
      this.player.name = name
    },

    touchSave() {
      this.lastSaveTime = Date.now()
      this.player.lastActiveTime = Date.now()
    },

    /** 挑战关卡，返回战斗结果（含掉落） */
    challengeLevel(levelId: string): BattleResult | null {
      const level = getLevel(levelId)
      if (!level) return null
      const stats = computePlayerStats(this.player)
      const result = runBattle(stats, this.player.name, this.sectInfo.skill, level.enemies)

      if (result.win) {
        this.player.exp += result.expGained
        while (this.player.exp >= expToNext(this.player.level)) {
          this.player.exp -= expToNext(this.player.level)
          this.player.level++
        }
        const drops: Equipment[] = []
        for (const e of level.enemies) {
          const d = rollDrop(e, level.index)
          if (d) drops.push(d)
        }
        result.drops = drops
        this.player.bag.push(...drops)
        if (!this.player.clearedLevelIds.includes(levelId)) {
          this.player.clearedLevelIds.push(levelId)
        }
        const nxt = nextLevelId(levelId)
        if (nxt) this.player.currentLevelId = nxt
      }
      this.touchSave()
      return result
    },

    /** 穿戴装备：从背包取出放入槽位，旧装备回背包 */
    equipItem(eqId: string) {
      const idx = this.player.bag.findIndex((e) => e.id === eqId)
      if (idx < 0) return
      const eq = this.player.bag[idx]
      this.player.bag.splice(idx, 1)
      const old = this.player.equipped[eq.slot]
      this.player.equipped[eq.slot] = eq
      if (old) this.player.bag.push(old)
    },

    /** 卸下装备 */
    unequip(slot: EquipSlot) {
      const eq = this.player.equipped[slot]
      if (!eq) return
      this.player.equipped[slot] = null
      this.player.bag.push(eq)
    },

    /** 检查离线收益（不发放，存入 pendingOffline） */
    checkOffline() {
      const now = Date.now()
      const reward = settleOffline(this.player.lastActiveTime, now, this.player.clearedLevelIds)
      this.pendingOffline = reward
      this.player.lastActiveTime = now
    },

    /** 领取离线收益 */
    claimOffline() {
      const r = this.pendingOffline
      if (!r) return
      this.player.exp += r.exp
      while (this.player.exp >= expToNext(this.player.level)) {
        this.player.exp -= expToNext(this.player.level)
        this.player.level++
      }
      this.player.bag.push(...r.drops)
      this.pendingOffline = null
      this.touchSave()
    }
  },
  persist: {
    key: 'jianghu1-save',
    storage: localStorage
  }
})
