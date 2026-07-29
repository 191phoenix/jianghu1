import { defineStore } from 'pinia'
import type { Player, BattleResult, Equipment, EquipSlot, OfflineReward, Sect } from '@/types/game'
import { DEFAULT_SECT, SECTS } from '@/config/sectConfig'
import { FIRST_LEVEL_ID, getLevel, nextLevelId } from '@/config/levelConfig'
import { computePlayerStats } from '@/logic/statsLogic'
import { runBattle, type AllyInput } from '@/logic/battleLogic'
import { expToNext } from '@/logic/growthLogic'
import { rollDrop } from '@/logic/equipmentLogic'
import { formationHeroes, heroesToAcquire } from '@/logic/heroLogic'
import { settleOffline } from '@/logic/offlineLogic'

function defaultPlayer(): Player {
  return {
    name: '无名侠客',
    sect: DEFAULT_SECT,
    level: 1,
    exp: 0,
    equipped: { weapon: null, armor: null, head: null, foot: null, accessory: null, neck: null },
    bag: [],
    heroes: [],
    formation: [null, null],
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
    /** 兼容旧存档：补全缺失字段与新增槽位 */
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
          head: p.equipped?.head ?? null,
          foot: p.equipped?.foot ?? null,
          accessory: p.equipped?.accessory ?? null,
          neck: p.equipped?.neck ?? null
        },
        bag: p.bag ?? d.bag,
        heroes: p.heroes ?? d.heroes,
        formation: p.formation && p.formation.length >= 2 ? p.formation : d.formation,
        currentLevelId: p.currentLevelId ?? d.currentLevelId,
        clearedLevelIds: p.clearedLevelIds ?? d.clearedLevelIds,
        createdAt: p.createdAt || Date.now(),
        lastActiveTime: p.lastActiveTime || Date.now()
      }
    },

    setPlayerName(name: string) {
      this.player.name = name
    },

    /** 切换门派（不影响进度，仅换技能） */
    changeSect(sectId: string) {
      if (SECTS[sectId]) {
        this.player.sect = sectId
        this.touchSave()
      }
    },

    /** 配置上阵侠客位 */
    setFormation(slotIdx: number, heroId: string | null) {
      if (slotIdx < 0 || slotIdx >= this.player.formation.length) return
      if (heroId) {
        const existing = this.player.formation.indexOf(heroId)
        if (existing >= 0 && existing !== slotIdx) {
          this.player.formation[existing] = null
        }
      }
      this.player.formation[slotIdx] = heroId
      this.touchSave()
    },

    touchSave() {
      this.lastSaveTime = Date.now()
      this.player.lastActiveTime = Date.now()
    },

    /** 挑战关卡：组玩家方（主角+上阵侠客）与敌人战斗 */
    challengeLevel(levelId: string): BattleResult | null {
      const level = getLevel(levelId)
      if (!level) return null

      const allies: AllyInput[] = [
        { name: this.player.name, stats: computePlayerStats(this.player), skill: this.sectInfo.skill }
      ]
      for (const h of formationHeroes(this.player)) {
        allies.push({ name: h.name, stats: h.stats, skill: h.skill })
      }

      const result = runBattle(allies, level.enemies)
      if (result.win) {
        this.player.exp += result.expGained
        while (this.player.exp >= expToNext(this.player.level)) {
          this.player.exp -= expToNext(this.player.level)
          this.player.level++
        }
        const drops: Equipment[] = []
        const levelIdx = (level.chapter - 1) * 10 + level.index
        for (const e of level.enemies) {
          const d = rollDrop(e, levelIdx)
          if (d) drops.push(d)
        }
        result.drops = drops
        this.player.bag.push(...drops)

        if (!this.player.clearedLevelIds.includes(levelId)) {
          this.player.clearedLevelIds.push(levelId)
        }
        // 获取侠客
        const acquired: string[] = []
        for (const h of heroesToAcquire(levelId)) {
          if (!this.player.heroes.includes(h.id)) {
            this.player.heroes.push(h.id)
            acquired.push(h.name)
          }
        }
        result.acquiredHeroes = acquired

        const nxt = nextLevelId(levelId)
        if (nxt) this.player.currentLevelId = nxt
      }
      this.touchSave()
      return result
    },

    equipItem(eqId: string) {
      const idx = this.player.bag.findIndex((e) => e.id === eqId)
      if (idx < 0) return
      const eq = this.player.bag[idx]
      this.player.bag.splice(idx, 1)
      const old = this.player.equipped[eq.slot]
      this.player.equipped[eq.slot] = eq
      if (old) this.player.bag.push(old)
    },

    unequip(slot: EquipSlot) {
      const eq = this.player.equipped[slot]
      if (!eq) return
      this.player.equipped[slot] = null
      this.player.bag.push(eq)
    },

    checkOffline() {
      const now = Date.now()
      const reward = settleOffline(this.player.lastActiveTime, now, this.player.clearedLevelIds)
      this.pendingOffline = reward
      this.player.lastActiveTime = now
    },

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
