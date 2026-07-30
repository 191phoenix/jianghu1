import { defineStore } from 'pinia'
import type { Player, BattleResult, Equipment, EquipSlot, OfflineReward, Sect, Enemy, PathReward } from '@/types/game'
import { DEFAULT_SECT, SECTS } from '@/config/sectConfig'
import { FIRST_LEVEL_ID, getLevel, nextLevelId } from '@/config/levelConfig'
import { ALL_SLOTS } from '@/config/equipmentConfig'
import { EQUIP_PRICE, STONE_PRICE, REFRESH_PRICE, SHOP_GEAR } from '@/config/shopConfig'
import { computePlayerStats } from '@/logic/statsLogic'
import type { AllyInput } from '@/logic/battleLogic'
import { expToNext } from '@/logic/growthLogic'
import { rollDrop, rollStones, rollSilver, MAX_STAR, enhanceCost, decomposeValue } from '@/logic/equipmentLogic'
import { formationHeroes, heroesToAcquire, computeHeroStats, heroExpToNext, getHero, emptyHeroEquipped } from '@/logic/heroLogic'
import { talentBonus, availableTalentPoints } from '@/logic/talentLogic'
import { innerSkillsToAcquire } from '@/logic/innerSkillLogic'
import { SKILL_LEVEL_COST, baseSkillOf, prereqMet, effectiveSectSkill } from '@/logic/sectSkillLogic'
import { settleOffline } from '@/logic/offlineLogic'
import { useBattleStore } from './battleStore'
import { usePathStore } from './pathStore'
import { genId } from '@/utils/id'
import { rollShopItems } from '@/logic/shopLogic'
import { TASKS, isTaskDone } from '@/logic/taskLogic'

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
    silver: 0,
    enhanceCount: 0,
    shopItems: [],
    purchasedShopGear: [],
    heroSects: {},
    heroSectSkillLevels: {},
    heroActiveSectSkill: {},
    sectSkillLevels: {},
    activeSectSkill: null,
    tasksClaimed: [],
    currentLevelId: FIRST_LEVEL_ID,
    clearedLevelIds: [],
    createdAt: 0,
    lastActiveTime: 0
  }
}

function ensureStar(eq: Equipment | null): void {
  if (eq && eq.star === undefined) eq.star = 0
}

/** 旧存档的武器没有 weaponType，默认为剑 */
function ensureWeaponType(eq: Equipment | null): void {
  if (eq && eq.slot === 'weapon' && !eq.weaponType) eq.weaponType = 'sword'
}

/** 迁移旧版侠客装备到 6 槽记录（旧版每侠客单件 Equipment） */
function migrateHeroEquipped(old: unknown): Record<string, Record<EquipSlot, Equipment | null>> {
  const result: Record<string, Record<EquipSlot, Equipment | null>> = {}
  if (!old || typeof old !== 'object') return result
  for (const id in old as Record<string, unknown>) {
    const v = (old as Record<string, unknown>)[id]
    const slots = emptyHeroEquipped()
    if (v && typeof v === 'object') {
      if ('id' in v && 'slot' in v && typeof (v as Equipment).slot === 'string') {
        // 旧版：单件装备，放入对应槽
        slots[(v as Equipment).slot] = v as Equipment
      } else {
        // 已是槽记录
        for (const s of ALL_SLOTS) {
          const e = (v as Record<string, unknown>)[s]
          if (e) slots[s] = e as Equipment
        }
      }
    }
    result[id] = slots
  }
  return result
}

/** 把路径节点奖励格式化为日志文字 */
function pathRewardText(r: PathReward): string {
  const parts: string[] = []
  if (r.exp) parts.push(`经验+${r.exp}`)
  if (r.silver) parts.push(`银两${r.silver > 0 ? '+' : ''}${r.silver}`)
  if (r.stones) parts.push(`强化石+${r.stones}`)
  if (r.drops?.length) parts.push(`得${r.drops.length}件装备`)
  return parts.join(' ')
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
        heroEquipped: migrateHeroEquipped(p.heroEquipped),
        seenEquipment: p.seenEquipment ?? d.seenEquipment,
        seenEnemies: p.seenEnemies ?? d.seenEnemies,
        silver: p.silver ?? d.silver,
        enhanceCount: p.enhanceCount ?? d.enhanceCount,
        shopItems: p.shopItems ?? d.shopItems,
        purchasedShopGear: p.purchasedShopGear ?? d.purchasedShopGear,
        heroSects: p.heroSects ?? d.heroSects,
        heroSectSkillLevels: p.heroSectSkillLevels ?? d.heroSectSkillLevels,
        heroActiveSectSkill: p.heroActiveSectSkill ?? d.heroActiveSectSkill,
        sectSkillLevels: p.sectSkillLevels ?? d.sectSkillLevels,
        activeSectSkill: p.activeSectSkill ?? d.activeSectSkill,
        tasksClaimed: p.tasksClaimed ?? d.tasksClaimed,
        currentLevelId: p.currentLevelId ?? d.currentLevelId,
        clearedLevelIds: p.clearedLevelIds ?? d.clearedLevelIds,
        createdAt: p.createdAt || Date.now(),
        lastActiveTime: p.lastActiveTime || Date.now()
      }
      for (const eq of this.player.bag) {
        ensureStar(eq)
        ensureWeaponType(eq)
      }
      for (const slot of ALL_SLOTS) {
        ensureStar(this.player.equipped[slot])
        ensureWeaponType(this.player.equipped[slot])
      }
      for (const id in this.player.heroEquipped) {
        for (const slot of ALL_SLOTS) {
          ensureStar(this.player.heroEquipped[id][slot])
          ensureWeaponType(this.player.heroEquipped[id][slot])
        }
      }
      for (const eq of this.player.shopItems) {
        ensureStar(eq)
        ensureWeaponType(eq)
      }
      this.ensureSectSkills()
    },

    /** 保底：主角与已拜门派侠客的基础武功 Lv.1，且主动武功有效 */
    ensureSectSkills() {
      const mainSect = SECTS[this.player.sect]
      if (mainSect) {
        const base = baseSkillOf(mainSect)
        if (base) {
          if ((this.player.sectSkillLevels[base.id] || 0) < 1) this.player.sectSkillLevels[base.id] = 1
          const cur = this.player.activeSectSkill
          const valid =
            !!cur && (this.player.sectSkillLevels[cur] || 0) >= 1 && mainSect.skills.some((s) => s.id === cur)
          if (!valid) this.player.activeSectSkill = base.id
        }
      }
      for (const heroId in this.player.heroSects) {
        const sect = SECTS[this.player.heroSects[heroId]]
        if (!sect) continue
        const base = baseSkillOf(sect)
        if (!base) continue
        if (!this.player.heroSectSkillLevels[heroId]) this.player.heroSectSkillLevels[heroId] = {}
        const levels = this.player.heroSectSkillLevels[heroId]
        if ((levels[base.id] || 0) < 1) levels[base.id] = 1
        const curRaw = this.player.heroActiveSectSkill[heroId]
        if (curRaw === undefined) {
          this.player.heroActiveSectSkill[heroId] = base.id // 缺省/旧存档 -> 用基础武功
        } else if (curRaw !== null) {
          const valid = (levels[curRaw] || 0) >= 1 && sect.skills.some((s) => s.id === curRaw)
          if (!valid) this.player.heroActiveSectSkill[heroId] = base.id
        }
      }
    },

    setPlayerName(name: string) {
      this.player.name = name
    },

    changeSect(sectId: string) {
      if (!SECTS[sectId]) return
      this.player.sect = sectId
      this.ensureSectSkills()
      this.touchSave()
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
      this.player.enhanceCount++
      this.touchSave()
    },

    /** 分解背包中的多余装备为强化石（品阶基础值 + 已投入星数） */
    decomposeEquipment(eqId: string) {
      const idx = this.player.bag.findIndex((e) => e.id === eqId)
      if (idx < 0) return
      const eq = this.player.bag[idx]
      this.player.stones += decomposeValue(eq)
      this.player.bag.splice(idx, 1)
      this.touchSave()
    },

    equipHero(heroId: string, eqId: string) {
      if (!this.player.heroes.includes(heroId)) return
      const idx = this.player.bag.findIndex((e) => e.id === eqId)
      if (idx < 0) return
      const eq = this.player.bag[idx]
      this.player.bag.splice(idx, 1)
      if (!this.player.heroEquipped[heroId]) this.player.heroEquipped[heroId] = emptyHeroEquipped()
      const old = this.player.heroEquipped[heroId][eq.slot]
      this.player.heroEquipped[heroId][eq.slot] = eq
      if (old) this.player.bag.push(old)
      this.touchSave()
    },

    unequipHero(heroId: string, slot: EquipSlot) {
      const slots = this.player.heroEquipped[heroId]
      if (!slots) return
      const eq = slots[slot]
      if (!eq) return
      slots[slot] = null
      this.player.bag.push(eq)
      this.touchSave()
    },

    /** 侠客拜入/退出门派（拜入保底基础武功 Lv.1 + 主动=基础；退出主动置 null=自带武功） */
    setHeroSect(heroId: string, sectId: string | null) {
      if (!this.player.heroes.includes(heroId)) return
      if (sectId === null) {
        delete this.player.heroSects[heroId]
        this.player.heroActiveSectSkill[heroId] = null
      } else {
        if (!SECTS[sectId]) return
        this.player.heroSects[heroId] = sectId
        if (!this.player.heroSectSkillLevels[heroId]) this.player.heroSectSkillLevels[heroId] = {}
        const base = baseSkillOf(SECTS[sectId])
        if (base) {
          if ((this.player.heroSectSkillLevels[heroId][base.id] || 0) < 1) {
            this.player.heroSectSkillLevels[heroId][base.id] = 1
          }
          this.player.heroActiveSectSkill[heroId] = base.id
        }
      }
      this.touchSave()
    },

    /** 校验并升级某武功一级（共享逻辑，返回是否成功） */
    tryLevelUp(levels: Record<string, number>, sectId: string, skillId: string): boolean {
      const sect = SECTS[sectId]
      const node = sect?.skills.find((s) => s.id === skillId)
      if (!node) return false
      const cur = levels[skillId] || 0
      if (cur >= node.maxLevel) return false
      if (cur === 0 && !prereqMet(node, levels)) return false // 习得需前置达标
      const cost = SKILL_LEVEL_COST(cur)
      if (this.player.silver < cost) return false
      this.player.silver -= cost
      levels[skillId] = cur + 1
      return true
    },

    /** 主角：升级门派武功 */
    levelUpSectSkill(skillId: string) {
      if (this.tryLevelUp(this.player.sectSkillLevels, this.player.sect, skillId)) {
        this.touchSave()
      }
    },

    /** 侠客：升级门派武功 */
    levelUpHeroSectSkill(heroId: string, skillId: string) {
      const sectId = this.player.heroSects[heroId]
      if (!sectId) return
      if (!this.player.heroSectSkillLevels[heroId]) this.player.heroSectSkillLevels[heroId] = {}
      if (this.tryLevelUp(this.player.heroSectSkillLevels[heroId], sectId, skillId)) {
        this.touchSave()
      }
    },

    /** 主角：设主动武功（须已习得） */
    setActiveSectSkill(skillId: string) {
      const sect = SECTS[this.player.sect]
      if (!sect) return
      if ((this.player.sectSkillLevels[skillId] || 0) < 1) return
      if (!sect.skills.some((s) => s.id === skillId)) return
      this.player.activeSectSkill = skillId
      this.touchSave()
    },

    /** 侠客：设主动武功（null=自带武功，skillId 须已习得） */
    setHeroActiveSectSkill(heroId: string, skillId: string | null) {
      if (skillId === null) {
        this.player.heroActiveSectSkill[heroId] = null
        this.touchSave()
        return
      }
      const sectId = this.player.heroSects[heroId]
      const sect = sectId ? SECTS[sectId] : null
      if (!sect) return
      if ((this.player.heroSectSkillLevels[heroId]?.[skillId] || 0) < 1) return
      if (!sect.skills.some((s) => s.id === skillId)) return
      this.player.heroActiveSectSkill[heroId] = skillId
      this.touchSave()
    },

    touchSave() {
      this.lastSaveTime = Date.now()
      this.player.lastActiveTime = Date.now()
    },

    /** 进入某关的路径推图（随机生成路径） */
    enterPath(levelId: string) {
      const level = getLevel(levelId)
      if (!level) return
      usePathStore().startPath(level)
    },

    /** 路径战斗节点：用节点敌人进入布阵（默认站位） */
    startPathBattle() {
      const ps = usePathStore()
      const node = ps.current
      if (!node || !node.enemies) return
      const level = getLevel(ps.run!.levelId)
      if (!level) return
      const chosen = this.player.formation
        .filter((id): id is string => !!id && this.player.heroes.includes(id))
        .slice(0, 2)
      const grid: (string | null)[] = Array(9).fill(null)
      grid[7] = 'main'
      chosen.forEach((id, i) => {
        grid[i === 0 ? 6 : 8] = id
      })
      useBattleStore().initSetup(level.id, node.enemies, chosen, grid)
    },

    /** 解决非战斗节点（剧情/宝箱） */
    resolvePathNonBattle() {
      const ps = usePathStore()
      const node = ps.current
      if (!node || (node.type !== 'story' && node.type !== 'treasure')) return
      const logMsg = node.reward ? `${node.label}：${pathRewardText(node.reward)}` : node.label
      if (node.reward) this.applyPathReward(node.reward)
      ps.advanceNonBattle(logMsg)
    },

    /** 解决事件节点：应用所选选项 */
    resolvePathEvent(choiceIdx: number) {
      const ps = usePathStore()
      const node = ps.current
      if (!node || node.type !== 'event' || !node.choices) return
      const choice = node.choices[choiceIdx]
      if (!choice) return
      this.applyPathReward(choice.reward)
      ps.advanceNonBattle(`${node.label}：${choice.outcomeText}`)
    },

    /** 应用路径节点奖励（银两/强化石可为负=惩罚） */
    applyPathReward(reward: PathReward) {
      if (reward.exp && reward.exp > 0) this.gainPlayerExp(reward.exp)
      if (reward.silver) this.player.silver = Math.max(0, this.player.silver + reward.silver)
      if (reward.stones) this.player.stones = Math.max(0, this.player.stones + reward.stones)
      if (reward.drops && reward.drops.length) {
        this.player.bag.push(...reward.drops)
        for (const d of reward.drops) {
          const key = `${d.slot}-${d.grade}`
          if (!this.player.seenEquipment.includes(key)) this.player.seenEquipment.push(key)
        }
      }
      this.touchSave()
    },

    /** 玩家获得经验并自动升级 */
    gainPlayerExp(amount: number) {
      this.player.exp += amount
      while (this.player.exp >= expToNext(this.player.level)) {
        this.player.exp -= expToNext(this.player.level)
        this.player.level++
      }
    },

    /** 战斗奖励：经验(含天赋加成)/掉落/强化石/银两/侠客经验；trackSeen 控制是否计入图鉴 */
    applyBattleRewards(
      enemies: Enemy[],
      levelIdx: number,
      factor: number,
      trackSeen: boolean
    ): { expGained: number; silverGained: number; stonesGained: number; drops: Equipment[] } {
      const { expBonus } = talentBonus(this.player.talents)
      const baseExp = enemies.reduce((s, e) => s + e.expReward, 0)
      const expGain = Math.floor(baseExp * factor * (1 + expBonus))
      this.gainPlayerExp(expGain)

      const drops: Equipment[] = []
      for (const e of enemies) {
        const d = rollDrop(e, levelIdx)
        if (d) drops.push(d)
      }
      this.player.bag.push(...drops)

      let stones = 0
      let silver = 0
      for (const e of enemies) {
        stones += rollStones(e)
        silver += rollSilver(e)
      }
      this.player.stones += stones
      this.player.silver += silver

      if (trackSeen) {
        for (const e of enemies) {
          if (!this.player.seenEnemies.includes(e.id)) this.player.seenEnemies.push(e.id)
        }
      }
      for (const d of drops) {
        const key = `${d.slot}-${d.grade}`
        if (!this.player.seenEquipment.includes(key)) this.player.seenEquipment.push(key)
      }

      const heroExpGain = Math.floor(expGain * 0.5)
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
      this.touchSave()
      return { expGained: expGain, silverGained: silver, stonesGained: stones, drops }
    },

    /** 过关结算：标记通关、获得侠客/内功、推进下一关（仅当通关当前所在关） */
    applyLevelClear(levelId: string): { acquiredHeroes: string[]; acquiredInnerSkills: string[] } {
      if (!this.player.clearedLevelIds.includes(levelId)) {
        this.player.clearedLevelIds.push(levelId)
      }
      const acquired: string[] = []
      for (const h of heroesToAcquire(levelId)) {
        if (!this.player.heroes.includes(h.id)) {
          this.player.heroes.push(h.id)
          acquired.push(h.name)
        }
      }
      const acquiredInner: string[] = []
      for (const s of innerSkillsToAcquire(levelId)) {
        if (!this.player.innerSkills.includes(s.id)) {
          this.player.innerSkills.push(s.id)
          acquiredInner.push(s.name)
        }
      }
      if (this.player.currentLevelId === levelId) {
        const nxt = nextLevelId(levelId)
        if (nxt) this.player.currentLevelId = nxt
      }
      this.touchSave()
      return { acquiredHeroes: acquired, acquiredInnerSkills: acquiredInner }
    },

    /** 路径战斗结束结算：胜则按节点类型给奖，关主再过关；败不动(可重打) */
    settlePathBattle(result: BattleResult): BattleResult {
      const ps = usePathStore()
      const run = ps.run
      const node = ps.current
      if (!run || !node || !node.enemies || !result.win) return result
      const level = getLevel(run.levelId)
      if (!level) return result
      const levelIdx = (level.chapter - 1) * 10 + level.index
      const factor = node.type === 'boss' ? 1.2 : node.type === 'elite' ? 1.0 : 0.6
      const r = this.applyBattleRewards(node.enemies, levelIdx, factor, node.type === 'boss')
      result.expGained = r.expGained
      result.silverGained = r.silverGained
      result.stonesGained = r.stonesGained
      result.drops = r.drops
      result.acquiredHeroes = []
      result.acquiredInnerSkills = []
      if (node.type === 'boss') {
        const c = this.applyLevelClear(run.levelId)
        result.acquiredHeroes = c.acquiredHeroes
        result.acquiredInnerSkills = c.acquiredInnerSkills
      }
      ps.onBattleWin(`击败${node.label}`)
      return result
    },

    /** 布阵完成，开战：写回 formation，构造我方 fighters */
    beginSetupCombat() {
      const bs = useBattleStore()
      const b = bs.battle
      if (!b || b.phase !== 'setup') return
      if (!b.setupGrid.includes('main')) return
      for (const id of b.setupChosen) {
        if (!b.setupGrid.includes(id)) return
      }
      // 写回 formation（≤2，补 null）
      const form: (string | null)[] = [...b.setupChosen]
      while (form.length < 2) form.push(null)
      this.player.formation = form
      // 按 setupGrid 构造 allies
      const allies: AllyInput[] = []
      b.setupGrid.forEach((key, cell) => {
        if (key) allies.push(this.buildAlly(key, cell))
      })
      bs.startCombat(allies)
    },

    /** 构造单个我方 AllyInput：key = 'main' 或侠客 id */
    buildAlly(key: string, pos: number): AllyInput {
      if (key === 'main') {
        const sect = this.sectInfo
        const base = baseSkillOf(sect)
        const skill =
          effectiveSectSkill(sect, this.player.activeSectSkill, this.player.sectSkillLevels) ??
          (base ? effectiveSectSkill(sect, base.id, this.player.sectSkillLevels) : null)
        return {
          name: this.player.name,
          stats: computePlayerStats(this.player),
          skill,
          weaponType: sect.weaponType,
          pos
        }
      }
      const h = getHero(key)
      const lvl = this.player.heroLevels[key] || 1
      const eq = this.player.heroEquipped[key] || emptyHeroEquipped()
      const sectId = this.player.heroSects[key] || null
      const sect = sectId ? SECTS[sectId] : null
      const heroLevels = this.player.heroSectSkillLevels[key] || {}
      const activeSkillId = this.player.heroActiveSectSkill[key] ?? null
      const sectSkill = sect ? effectiveSectSkill(sect, activeSkillId, heroLevels) : null
      return {
        name: h ? h.name : key,
        stats: h
          ? computeHeroStats(h, lvl, eq, sectId)
          : { hp: 1, atk: 1, def: 0, spd: 1, critRate: 0, critDmg: 1 },
        skill: h ? (sectSkill ?? h.skill) : null,
        weaponType: h ? h.weaponType : 'fist',
        pos
      }
    },

    /** 战斗结束后结算（非路径战斗兜底：整关一次性结算） */
    settleBattle(levelId: string, result: BattleResult): BattleResult {
      const level = getLevel(levelId)
      if (!level) return result
      if (result.win) {
        const levelIdx = (level.chapter - 1) * 10 + level.index
        const r = this.applyBattleRewards(level.enemies, levelIdx, 1, true)
        result.expGained = r.expGained
        result.silverGained = r.silverGained
        result.stonesGained = r.stonesGained
        result.drops = r.drops
        const c = this.applyLevelClear(levelId)
        result.acquiredHeroes = c.acquiredHeroes
        result.acquiredInnerSkills = c.acquiredInnerSkills
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

    /** 商店：买装备摊指定位置 */
    buyShopEquip(idx: number) {
      const eq = this.player.shopItems[idx]
      if (!eq) return
      const price = EQUIP_PRICE[eq.grade]
      if (this.player.silver < price) return
      this.player.silver -= price
      this.player.shopItems.splice(idx, 1)
      this.player.bag.push(eq)
      this.touchSave()
    },

    /** 商店：购买招牌装备（每件仅一次） */
    buyShopGear(gearId: string) {
      if (this.player.purchasedShopGear.includes(gearId)) return
      const gear = SHOP_GEAR.find((g) => g.id === gearId)
      if (!gear) return
      if (this.player.silver < gear.price) return
      this.player.silver -= gear.price
      this.player.bag.push({
        id: genId('eq'),
        name: gear.name,
        slot: gear.slot,
        grade: gear.grade,
        stats: { ...gear.stats },
        star: 0,
        ...(gear.weaponType ? { weaponType: gear.weaponType } : {})
      })
      this.player.purchasedShopGear.push(gearId)
      this.touchSave()
    },

    /** 商店：花银两买 1 颗强化石 */
    buyStones() {
      if (this.player.silver < STONE_PRICE) return
      this.player.silver -= STONE_PRICE
      this.player.stones += 1
      this.touchSave()
    },

    /** 商店：刷新装备摊 */
    refreshShop() {
      if (this.player.silver < REFRESH_PRICE) return
      this.player.silver -= REFRESH_PRICE
      this.player.shopItems = rollShopItems(this.player)
      this.touchSave()
    },

    initShopIfEmpty() {
      if (this.player.shopItems.length === 0) {
        this.player.shopItems = rollShopItems(this.player)
      }
    },

    /** 领取任务奖励 */
    claimTask(id: string) {
      const task = TASKS.find((t) => t.id === id)
      if (!task) return
      if (this.player.tasksClaimed.includes(id)) return
      if (!isTaskDone(this.player, task)) return
      this.player.silver += task.reward.silver
      this.player.stones += task.reward.stones
      this.player.tasksClaimed.push(id)
      this.touchSave()
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
