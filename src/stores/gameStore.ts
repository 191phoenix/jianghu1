import { defineStore } from 'pinia'
import type { Player, BattleResult, Equipment, EquipSlot, OfflineReward, Sect } from '@/types/game'
import { DEFAULT_SECT, SECTS } from '@/config/sectConfig'
import { FIRST_LEVEL_ID, getLevel, nextLevelId } from '@/config/levelConfig'
import { ALL_SLOTS } from '@/config/equipmentConfig'
import { computePlayerStats } from '@/logic/statsLogic'
import { runBattle, type AllyInput } from '@/logic/battleLogic'
import { expToNext } from '@/logic/growthLogic'
import { rollDrop, rollStones, MAX_STAR, enhanceCost } from '@/logic/equipmentLogic'
import { formationHeroes, heroesToAcquire, computeHeroStats, heroExpToNext } from '@/logic/heroLogic'
import { talentBonus, availableTalentPoints } from '@/logic/talentLogic'
import { innerSkillsToAcquire } from '@/logic/innerSkillLogic'
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
    talents: {},
    innerSkill: null,
    innerSkills: [],
    stones: 0,
    heroLevels: {},
    heroExp: {},
    heroEquipped: {},
    seenEquipment: [],
    seenEnemies: [],
    currentLevelId: FIRST_LEVEL_ID,
    clearedLevelIds: [],
    createdAt: 0,
    lastActiveTime: 0
  }
}

function ensureStar(eq: Equipment | null): void {
  if (eq && eq.star === undefined) eq.star = 0
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
        talents: p.talents ?? d.talents,
        innerSkill: p.innerSkill ?? d.innerSkill,
        innerSkills: p.innerSkills ?? d.innerSkills,
        stones: p.stones ?? d.stones,
        heroLevels: p.heroLevels ?? d.heroLevels,
        heroExp: p.heroExp ?? d.heroExp,
        heroEquipped: p.heroEquipped ?? d.heroEquipped,
        seenEquipment: p.seenEquipment ?? d.seenEquipment,
        seenEnemies: p.seenEnemies ?? d.seenEnemies,
        currentLevelId: p.currentLevelId ?? d.currentLevelId,
        clearedLevelIds: p.clearedLevelIds ?? d.clearedLevelIds,
        createdAt: p.createdAt || Date.now(),
        lastActiveTime: p.lastActiveTime || Date.now()
      }
      for (const eq of this.player.bag) ensureStar(eq)
      for (const slot of ALL_SLOTS) ensureStar(this.player.equipped[slot])
      for (const id in this.player.heroEquipped) ensureStar(this.player.heroEquipped[id])
    },

    setPlayerName(name: string) {
      this.player.name = name
    },

    changeSect(sectId: string) {
      if (SECTS[sectId]) {
        this.player.sect = sectId
        this.touchSave()
      }
    },

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

    addTalent(key: string) {
      if (availableTalentPoints(this.player) <= 0) return
      this.player.talents[key] = (this.player.talents[key] || 0) + 1
      this.touchSave()
    },

    equipInner(id: string) {
      if (this.player.innerSkills.includes(id)) {
        this.player.innerSkill = id
        this.touchSave()
      }
    },

    enhanceEquipment(eqId: string) {
      let eq: Equipment | undefined = this.player.bag.find((e) => e.id === eqId)
      if (!eq) {
        for (const slot of ALL_SLOTS) {
          const e = this.player.equipped[slot]
          if (e?.id === eqId) {
            eq = e
            break
          }
        }
      }
      if (!eq || eq.star >= MAX_STAR) return
      const cost = enhanceCost(eq.star)
      if (this.player.stones < cost) return
      this.player.stones -= cost
      eq.star++
      this.touchSave()
    },

    /** 给侠客穿装备（从背包取，旧装备回背包） */
    equipHero(heroId: string, eqId: string) {
      if (!this.player.heroes.includes(heroId)) return
      const idx = this.player.bag.findIndex((e) => e.id === eqId)
      if (idx < 0) return
      const eq = this.player.bag[idx]
      this.player.bag.splice(idx, 1)
      const old = this.player.heroEquipped[heroId] || null
      this.player.heroEquipped[heroId] = eq
      if (old) this.player.bag.push(old)
      this.touchSave()
    },

    /** 卸下侠客装备 */
    unequipHero(heroId: string) {
      const eq = this.player.heroEquipped[heroId]
      if (!eq) return
      this.player.heroEquipped[heroId] = null
      this.player.bag.push(eq)
      this.touchSave()
    },

    touchSave() {
      this.lastSaveTime = Date.now()
      this.player.lastActiveTime = Date.now()
    },

    challengeLevel(levelId: string): BattleResult | null {
      const level = getLevel(levelId)
      if (!level) return null

      const allies: AllyInput[] = [
        { name: this.player.name, stats: computePlayerStats(this.player), skill: this.sectInfo.skill }
      ]
      for (const h of formationHeroes(this.player)) {
        const lvl = this.player.heroLevels[h.id] || 1
        const eq = this.player.heroEquipped[h.id] || null
        allies.push({ name: h.name, stats: computeHeroStats(h, lvl, eq), skill: h.skill })
      }

      const result = runBattle(allies, level.enemies)
      if (result.win) {
        // 主角经验（悟性加成）
        const { expBonus } = talentBonus(this.player.talents)
        const expGain = Math.floor(result.expGained * (1 + expBonus))
        this.player.exp += expGain
        result.expGained = expGain
        while (this.player.exp >= expToNext(this.player.level)) {
          this.player.exp -= expToNext(this.player.level)
          this.player.level++
        }

        // 装备掉落
        const drops: Equipment[] = []
        const levelIdx = (level.chapter - 1) * 10 + level.index
        for (const e of level.enemies) {
          const d = rollDrop(e, levelIdx)
          if (d) drops.push(d)
        }
        result.drops = drops
        this.player.bag.push(...drops)

        // 强化石
        let stones = 0
        for (const e of level.enemies) stones += rollStones(e)
        this.player.stones += stones
        result.stonesGained = stones

        // 图鉴：见过敌人 + 装备
        for (const e of level.enemies) {
          if (!this.player.seenEnemies.includes(e.id)) this.player.seenEnemies.push(e.id)
        }
        for (const d of drops) {
          const key = `${d.slot}-${d.grade}`
          if (!this.player.seenEquipment.includes(key)) this.player.seenEquipment.push(key)
        }

        if (!this.player.clearedLevelIds.includes(levelId)) {
          this.player.clearedLevelIds.push(levelId)
        }

        // 侠客经验（主角的 50%）
        const heroExpGain = Math.floor(result.expGained * 0.5)
        for (const h of formationHeroes(this.player)) {
          let exp = (this.player.heroExp[h.id] || 0) + heroExpGain
          let lvl = this.player.heroLevels[h.id] || 1
          while (exp >= heroExpToNext(lvl)) {
            exp -= heroExpToNext(lvl)
            lvl++
          }
          this.player.heroExp[h.id] = exp
          this.player.heroLevels[h.id] = lvl
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

        // 获取内功
        const acquiredInner: string[] = []
        for (const s of innerSkillsToAcquire(levelId)) {
          if (!this.player.innerSkills.includes(s.id)) {
            this.player.innerSkills.push(s.id)
            acquiredInner.push(s.name)
          }
        }
        result.acquiredInnerSkills = acquiredInner

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
      this.player.stones += r.stones
      this.pendingOffline = null
      this.touchSave()
    }
  },
  persist: {
    key: 'jianghu1-save',
    storage: localStorage
  }
})
